import * as yup from 'yup';

export interface ArthurClientContext {
  readonly tenant: string;
  // review types here
  readonly headers: any;
  readonly uri?: string;
  // review types here by using either https://github.com/developit/unfetch/blob/master/src/index.d.ts
  // or node-fetch types
  readonly fetch?: any;
}

const REGEX_UUID_V5 = /^[0-9A-F]{8}-[0-9A-F]{4}-[5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
const ARTHUR_CLIENT_CONTEXT_SCHEMA = yup.object().shape({
  tenant: yup
    .string()
    .required()
    .test('isuuidv5', 'tenant must be a valid UUIDv5', (
      value
    ): boolean => {
      return REGEX_UUID_V5.test(value);
    }),
  uri: yup.string().url(),
  headers: yup.object().required(),
  fetch: yup
    .mixed()
    .test('isFunction', 'fetch must be a function', (value): boolean => {
      return value === undefined || typeof value === 'function';
    })
});

export class ArthurClient {

  public context: ArthurClientContext;

  constructor(options: ArthurClientContext) {
    if(ARTHUR_CLIENT_CONTEXT_SCHEMA.validateSync(options)) {
      this.context = { ...options };
    }
  }

  public setContext(context: ArthurClientContext): void {
    if (ARTHUR_CLIENT_CONTEXT_SCHEMA.validateSync(context)) {
      this.context = { ...context };
    }
  }

  public async query({ query, context }: { readonly query: any, readonly context: ArthurClientContext}): Promise<any> {
    let currentContext = this.context;
    if (context && ARTHUR_CLIENT_CONTEXT_SCHEMA.validateSync(context)) {
      currentContext = context;
    }
    if (typeof query !== 'object' || query === null) {
      throw new Error('query should be an object');
    }
    const {
      fetch = window && window.fetch ? window.fetch : nofetch,
      headers = {},
      tenant,
      uri
    } = currentContext;

    const response: Response = await fetch(
      `${uri}?query=${encodeURIComponent(JSON.stringify(query))}`,
      {
        method: 'get',
        headers: {
          ...(headers || {}),
          'arthur-tenantkey': tenant
        }
      }
    );

    if (!response.ok) {
      throw new Error(`${response.status} (${response.statusText})`);
    }
    return response.json();
  }
}


function nofetch(): void {
  throw new Error('Fetch API is unavailable and no custom fetch function was provided')
}