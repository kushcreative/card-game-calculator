import { useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: object;
  execute: (input: unknown) => unknown;
};
export function useGameTools(
  read: () => unknown,
  record: (input: unknown) => unknown,
) {
  const actions = useRef({ read, record });
  useLayoutEffect(() => {
    actions.current = { read, record };
  }, [read, record]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: 'read_game',
        description: 'Read the players, rounds, and live total scores.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: () => actions.current.read(),
      },
      {
        name: 'save_current_round',
        description:
          'Validate and save bids and actual results for every current player in the selected round.',
        inputSchema: {
          type: 'object',
          properties: {
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  playerId: { type: 'string' },
                  bid: {
                    oneOf: [
                      { type: 'integer', minimum: 0 },
                      { type: 'string', pattern: '^[0-9]+$' },
                    ],
                    description:
                      'A non-negative whole-number bid. Use a string for values outside the safe JSON integer range.',
                  },
                  actual: {
                    oneOf: [
                      { type: 'integer', minimum: 0 },
                      { type: 'string', pattern: '^[0-9]+$' },
                    ],
                    description:
                      'A non-negative whole-number actual-win count. The game validates the combined total across all players and rounds.',
                  },
                },
                required: ['playerId', 'bid', 'actual'],
                additionalProperties: false,
              },
            },
          },
          required: ['entries'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          let result: unknown;
          flushSync(() => {
            result = actions.current.record(input);
          });
          return result;
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
  }, []);
}
