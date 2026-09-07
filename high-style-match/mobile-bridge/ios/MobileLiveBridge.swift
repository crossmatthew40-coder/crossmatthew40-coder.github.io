import Foundation
import UIKit
import UniformTypeIdentifiers

protocol MobileLiveBridgeDelegate: AnyObject {
    func mobileLiveBridge(_ bridge: MobileLiveBridge, didChooseFolder name: String)
    func mobileLiveBridge(_ bridge: MobileLiveBridge, didDetectFile payload: [String: Any])
    func mobileLiveBridge(_ bridge: MobileLiveBridge, didFail message: String)
}

final class MobileLiveBridge: NSObject, UIDocumentPickerDelegate {
    weak var delegate: MobileLiveBridgeDelegate?

    private let bookmarkKey = "hsm.mobileLive.captureFolderBookmark"
    private var folderURL: URL?
    private var timer: Timer?
    private var known: [String: String] = [:]
    private var pending: [String: (signature: String, count: Int)] = [:]
    private var securityScopeActive = false

    private let allowedExtensions: Set<String> = [
        "cr3", "cr2", "nef", "arw", "raf", "dng", "orf", "rw2",
        "jpg", "jpeg", "png", "tif", "tiff"
    ]

    override init() {
        super.init()
        restoreFolderBookmark()
    }

    deinit {
        stopWatching()
    }

    func chooseCaptureFolder(from presenter: UIViewController) {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.folder], asCopy: false)
        picker.delegate = self
        picker.allowsMultipleSelection = false
        presenter.present(picker, animated: true)
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else { return }
        do {
            try saveBookmark(for: url)
            folderURL = url
            delegate?.mobileLiveBridge(self, didChooseFolder: url.lastPathComponent)
        } catch {
            delegate?.mobileLiveBridge(self, didFail: "Could not save Capture folder access: \(error.localizedDescription)")
        }
    }

    func startWatching() {
        stopWatching()
        guard let url = resolvedFolderURL() else {
            delegate?.mobileLiveBridge(self, didFail: "Choose the Capture One folder first.")
            return
        }

        folderURL = url
        securityScopeActive = url.startAccessingSecurityScopedResource()
        known.removeAll()
        pending.removeAll()
        seedSnapshot(url)

        timer = Timer.scheduledTimer(withTimeInterval: 0.65, repeats: true) { [weak self] _ in
            self?.scan()
        }
        RunLoop.main.add(timer!, forMode: .common)
    }

    func stopWatching() {
        timer?.invalidate()
        timer = nil
        pending.removeAll()
        if securityScopeActive {
            folderURL?.stopAccessingSecurityScopedResource()
            securityScopeActive = false
        }
    }

    func rescanAfterResume() {
        guard timer != nil else { return }
        scan()
    }

    func readFile(path: String) throws -> [String: Any] {
        let url = URL(fileURLWithPath: path)
        guard isInsideSelectedFolder(url) else {
            throw NSError(domain: "HighStyleMatch.MobileLive", code: 403, userInfo: [NSLocalizedDescriptionKey: "The requested file is outside the selected Capture folder."])
        }
        let data = try Data(contentsOf: url, options: [.mappedIfSafe])
        let values = try url.resourceValues(forKeys: [.contentModificationDateKey, .contentTypeKey])
        let mime = values.contentType?.preferredMIMEType ?? "application/octet-stream"
        let modified = values.contentModificationDate?.timeIntervalSince1970 ?? Date().timeIntervalSince1970
        return [
            "name": url.lastPathComponent,
            "base64": data.base64EncodedString(),
            "contentType": mime,
            "modified": Int(modified * 1000)
        ]
    }

    private func saveBookmark(for url: URL) throws {
        let started = url.startAccessingSecurityScopedResource()
        defer { if started { url.stopAccessingSecurityScopedResource() } }
        let data = try url.bookmarkData(options: [.minimalBookmark], includingResourceValuesForKeys: nil, relativeTo: nil)
        UserDefaults.standard.set(data, forKey: bookmarkKey)
    }

    private func restoreFolderBookmark() {
        folderURL = resolvedFolderURL()
    }

    private func resolvedFolderURL() -> URL? {
        guard let data = UserDefaults.standard.data(forKey: bookmarkKey) else { return nil }
        var stale = false
        do {
            let url = try URL(resolvingBookmarkData: data, options: [.withoutUI], relativeTo: nil, bookmarkDataIsStale: &stale)
            if stale {
                try saveBookmark(for: url)
            }
            return url
        } catch {
            UserDefaults.standard.removeObject(forKey: bookmarkKey)
            return nil
        }
    }

    private func seedSnapshot(_ root: URL) {
        for url in enumerateFiles(root) {
            if let sig = signature(url) {
                known[url.path] = sig
            }
        }
    }

    private func scan() {
        guard let root = folderURL else { return }
        for url in enumerateFiles(root) {
            let path = url.path
            guard known[path] == nil, let sig = signature(url) else { continue }

            if let current = pending[path], current.signature == sig {
                let next = current.count + 1
                if next >= 2 {
                    pending.removeValue(forKey: path)
                    known[path] = sig
                    emit(url)
                } else {
                    pending[path] = (sig, next)
                }
            } else {
                pending[path] = (sig, 1)
            }
        }
    }

    private func enumerateFiles(_ root: URL) -> [URL] {
        guard let enumerator = FileManager.default.enumerator(
            at: root,
            includingPropertiesForKeys: [.isRegularFileKey, .fileSizeKey, .contentModificationDateKey],
            options: [.skipsHiddenFiles, .skipsPackageDescendants]
        ) else { return [] }

        var out: [URL] = []
        for case let url as URL in enumerator {
            guard allowedExtensions.contains(url.pathExtension.lowercased()) else { continue }
            if (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true {
                out.append(url)
            }
        }
        return out
    }

    private func signature(_ url: URL) -> String? {
        do {
            let values = try url.resourceValues(forKeys: [.fileSizeKey, .contentModificationDateKey])
            let size = values.fileSize ?? 0
            let modified = values.contentModificationDate?.timeIntervalSince1970 ?? 0
            return "\(size):\(Int(modified * 1000))"
        } catch {
            return nil
        }
    }

    private func emit(_ url: URL) {
        do {
            let values = try url.resourceValues(forKeys: [.fileSizeKey, .contentModificationDateKey])
            let modified = values.contentModificationDate?.timeIntervalSince1970 ?? Date().timeIntervalSince1970
            delegate?.mobileLiveBridge(self, didDetectFile: [
                "path": url.path,
                "name": url.lastPathComponent,
                "size": values.fileSize ?? 0,
                "modified": Int(modified * 1000)
            ])
        } catch {
            delegate?.mobileLiveBridge(self, didFail: "A new capture was found but could not be read: \(error.localizedDescription)")
        }
    }

    private func isInsideSelectedFolder(_ file: URL) -> Bool {
        guard let root = folderURL?.standardizedFileURL.path else { return false }
        let path = file.standardizedFileURL.path
        return path == root || path.hasPrefix(root.hasSuffix("/") ? root : root + "/")
    }
}
