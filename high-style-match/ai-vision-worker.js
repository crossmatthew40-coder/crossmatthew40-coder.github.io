import {
  AutoProcessor,
  AutoModelForVision2Seq,
  TextStreamer,
  load_image,
} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm';

const MODEL_ID = 'HuggingFaceTB/SmolVLM-256M-Instruct';
let processor = null;
let model = null;
let loading = null;

function post(status, data = {}) {
  self.postMessage({ status, ...data });
}

async function loadModel() {
  if (processor && model) return [processor, model];
  if (loading) return loading;
  if (!self.navigator?.gpu) throw new Error('WebGPU is not available in this browser.');

  loading = (async () => {
    post('model-loading', { message: 'Loading AI Vision model…' });
    const progress_callback = (p) => {
      const progress = Number.isFinite(p?.progress) ? Math.round(p.progress) : null;
      post('model-progress', {
        progress,
        file: p?.file || p?.name || '',
        message: progress == null ? 'Preparing local AI model…' : `Loading local AI model ${progress}%`,
      });
    };

    processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback });
    model = await AutoModelForVision2Seq.from_pretrained(MODEL_ID, {
      dtype: 'fp32',
      device: 'webgpu',
      progress_callback,
    });
    post('model-ready', { model: MODEL_ID });
    return [processor, model];
  })();

  try {
    return await loading;
  } catch (error) {
    loading = null;
    processor = null;
    model = null;
    throw error;
  }
}

async function analyse({ id, blob, prompt }) {
  const [proc, mdl] = await loadModel();
  const url = URL.createObjectURL(blob);
  try {
    const image = await load_image(url);
    const messages = [{
      role: 'user',
      content: [
        { type: 'image', image: url },
        { type: 'text', text: prompt },
      ],
    }];
    const text = proc.apply_chat_template(messages, { add_generation_prompt: true });
    const inputs = await proc(text, [image], { do_image_splitting: false });
    let generated = '';
    const streamer = new TextStreamer(proc.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (chunk) => { generated += chunk; },
    });

    await mdl.generate({
      ...inputs,
      do_sample: false,
      repetition_penalty: 1.05,
      max_new_tokens: 180,
      streamer,
    });

    post('analysis-complete', { id, output: generated.trim() });
  } finally {
    URL.revokeObjectURL(url);
  }
}

self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {};
  try {
    if (type === 'load') {
      await loadModel();
      return;
    }
    if (type === 'analyse') {
      await analyse(data || {});
      return;
    }
  } catch (error) {
    post('error', {
      id: data?.id || null,
      message: error?.message || String(error),
      stack: error?.stack || null,
    });
  }
});
