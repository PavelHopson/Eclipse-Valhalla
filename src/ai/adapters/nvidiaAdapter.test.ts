import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nvidiaAdapter } from './nvidiaAdapter';
import {
  AIChatRequest,
  AIProviderConfig,
  DEFAULT_MODELS,
  NVIDIA_NIM_BASE_URL,
} from '../types';

function makeConfig(overrides: Partial<AIProviderConfig> = {}): AIProviderConfig {
  return {
    id: 'test_nvidia',
    type: 'nvidia',
    name: 'Test NVIDIA NIM',
    apiKey: 'nvapi-test-key',
    model: DEFAULT_MODELS.nvidia,
    enabled: true,
    isDefault: false,
    capabilities: ['chat', 'planning'],
    createdAt: '2026-04-15T00:00:00Z',
    updatedAt: '2026-04-15T00:00:00Z',
    ...overrides,
  };
}

function mockJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function mockTextResponse(text: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new Error('not json');
    },
    text: async () => text,
  } as unknown as Response;
}

describe('nvidiaAdapter.type', () => {
  it('reports provider type "nvidia"', () => {
    expect(nvidiaAdapter.type).toBe('nvidia');
  });
});

describe('nvidiaAdapter.chat', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to the NVIDIA NIM base URL + /chat/completions', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({
        choices: [{ message: { content: 'Hello from Nemotron' } }],
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        usage: { total_tokens: 42 },
      }),
    );

    const request: AIChatRequest = {
      messages: [{ role: 'user', content: 'hi' }],
    };

    await nvidiaAdapter.chat(request, makeConfig());

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${NVIDIA_NIM_BASE_URL}/chat/completions`);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers.Authorization).toBe('Bearer nvapi-test-key');
    expect(init.headers.Accept).toBe('application/json');
  });

  it('includes the model, messages, max_tokens, and temperature in the body', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({
        choices: [{ message: { content: 'ok' } }],
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
      }),
    );

    await nvidiaAdapter.chat(
      {
        messages: [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'Plan my day.' },
        ],
        maxTokens: 512,
        temperature: 0.3,
      },
      makeConfig(),
    );

    const init = fetchMock.mock.calls[0][1];
    const body = JSON.parse(init.body);
    expect(body.model).toBe(DEFAULT_MODELS.nvidia);
    expect(body.messages).toEqual([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Plan my day.' },
    ]);
    expect(body.max_tokens).toBe(512);
    expect(body.temperature).toBe(0.3);
  });

  it('falls back to config-level max_tokens and temperature', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({
        choices: [{ message: { content: 'ok' } }],
        model: 'x',
      }),
    );

    await nvidiaAdapter.chat(
      { messages: [{ role: 'user', content: 'hi' }] },
      makeConfig({ maxTokens: 1024, temperature: 0.9 }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(1024);
    expect(body.temperature).toBe(0.9);
  });

  it('uses sensible defaults (2048 tokens / 0.7 temperature) when unset', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ choices: [{ message: { content: 'ok' } }], model: 'x' }),
    );

    await nvidiaAdapter.chat({ messages: [{ role: 'user', content: 'hi' }] }, makeConfig());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(2048);
    expect(body.temperature).toBe(0.7);
  });

  it('strips trailing slashes from a custom baseUrl', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ choices: [{ message: { content: 'ok' } }], model: 'x' }),
    );

    await nvidiaAdapter.chat(
      { messages: [{ role: 'user', content: 'hi' }] },
      makeConfig({ baseUrl: 'https://self-hosted-nim.example.com/v1///' }),
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://self-hosted-nim.example.com/v1/chat/completions',
    );
  });

  it('returns the chat response shape with provider="nvidia"', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({
        choices: [{ message: { content: 'Hello world' } }],
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        usage: { total_tokens: 99 },
      }),
    );

    const response = await nvidiaAdapter.chat(
      { messages: [{ role: 'user', content: 'hi' }] },
      makeConfig(),
    );

    expect(response.content).toBe('Hello world');
    expect(response.model).toBe('nvidia/llama-3.3-nemotron-super-49b-v1');
    expect(response.provider).toBe('nvidia');
    expect(response.tokensUsed).toBe(99);
    expect(response.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('returns empty content when upstream returns malformed choices', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ choices: [], model: 'x' }));

    const response = await nvidiaAdapter.chat(
      { messages: [{ role: 'user', content: 'hi' }] },
      makeConfig(),
    );
    expect(response.content).toBe('');
  });

  it('throws with HTTP status + body on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(mockTextResponse('rate limited', 429));

    await expect(
      nvidiaAdapter.chat({ messages: [{ role: 'user', content: 'hi' }] }, makeConfig()),
    ).rejects.toThrow(/NVIDIA NIM API 429/);
  });

  it('propagates network errors from fetch', async () => {
    fetchMock.mockRejectedValueOnce(new Error('fetch failed'));

    await expect(
      nvidiaAdapter.chat({ messages: [{ role: 'user', content: 'hi' }] }, makeConfig()),
    ).rejects.toThrow('fetch failed');
  });
});

describe('nvidiaAdapter.validate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns valid=true when /models is reachable', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ data: [] }));

    const result = await nvidiaAdapter.validate(makeConfig());
    expect(result.valid).toBe(true);
    expect(result.model).toBe(DEFAULT_MODELS.nvidia);
    expect(fetchMock.mock.calls[0][0]).toBe(`${NVIDIA_NIM_BASE_URL}/models`);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer nvapi-test-key');
  });

  it('returns valid=false with HTTP status on 401', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ error: 'unauthorized' }, 401));

    const result = await nvidiaAdapter.validate(makeConfig());
    expect(result.valid).toBe(false);
    expect(result.error).toContain('401');
  });

  it('returns valid=false with the error message on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('DNS lookup failed'));

    const result = await nvidiaAdapter.validate(makeConfig());
    expect(result.valid).toBe(false);
    expect(result.error).toBe('DNS lookup failed');
  });

  it('falls back to "Connection failed" for non-Error throw values', async () => {
    fetchMock.mockRejectedValueOnce('string error');

    const result = await nvidiaAdapter.validate(makeConfig());
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Connection failed');
  });
});
