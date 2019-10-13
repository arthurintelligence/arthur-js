import 'jest';
import { FetchMock } from 'jest-fetch-mock';
import qs from 'qs';
import { ArthurClient, ArthurClientContext } from './ArthurClient';

const fetchMock = fetch as FetchMock;

function testInvalidContext(fn): void {
  test('given invalid context, should throw error', () => {
    // act
    // assert
    // @ts-ignore
    expect(() => fn({})).toThrow(
      new Error('headers is a required field')
    );
    // @ts-ignore
    expect(() => fn({ headers: {} })).toThrow(
      new Error('tenant is a required field')
    );
    // @ts-ignore
    expect(() => fn({ tenant: 'tenant', headers: {} })).toThrow(
      new Error('tenant must be a valid UUIDv5')
    );
    expect(
      () =>
        // @ts-ignore
        fn({
          tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
          uri: 'uri',
          headers: {}
        })
    ).toThrow(new Error('uri must be a valid URL'));
    expect(
      () =>
        // @ts-ignore
        fn({
          tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
          uri: 'https://example.com',
          headers: {}
        })
    ).not.toThrow();
    expect(
      () =>
        // @ts-ignore
        fn({
          tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
          headers: false
        })
    ).toThrow(
      new Error(
        'headers must be a `object` type, but the final value was: `null` (cast from the value `false`).\n If "null" is intended as an empty value be sure to mark the schema as `.nullable()`'
      )
    );
    expect(
      () =>
        // @ts-ignore
        fn({
          tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
          fetch: false,
          headers: {}
        })
    ).toThrow(new Error('fetch must be a function'));
  });
}

describe('constructor', () => {
  testInvalidContext((value: ArthurClientContext) => new ArthurClient(value));

  test('given valid context, should assign them as context', () => {
    // arrange
    const options = {
      tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      headers: {}
    };

    // act
    const client = new ArthurClient(options);

    // assert
    // @ts-ignore
    expect(client.context).toEqual(options);
  });
})

describe('setContext', () => {
  testInvalidContext((value: ArthurClientContext) => (new ArthurClient({
      tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      headers: {}
  })).setContext(value));

  test('given valid context, should assign them as context', () => {
    // arrange
    const options = {
      tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      headers: {}
    };
    const context = {
      tenant: '9342d47a-1bab-5709-9869-c840b2eac501',
      headers: {}
    };

    // act
    const client = new ArthurClient(options);
    client.setContext(context);

    // assert
    // @ts-ignore
    expect(client.context).toEqual(context);
  });
});

describe('query', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  })

  test('should sanitize headers by encoding them into URIComponents', async () => {
    // arrange
    const options = {
      tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      headers: {
        'header1': 'hello world',
        'header2': 'hello&world%',
      },
    };
    const jsonMock = jest.fn(() => ({}))
    fetchMock.mockResponse(() => Promise.resolve({ 
      ok: true, 
      status: 200, 
      statusText: 'OK', 
      json: jsonMock, 
      body: '{}' 
    }));
    // act
    const client = new ArthurClient(options);
    await client.query({ query: { startDate: 1, endDate: 2 } });
    // assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'arthur-tenant-key': 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      'header1': 'hello%20world',
      'header2': 'hello%26world%25',
    });
  });

  test('should add the tenant key as a the `arthur-tenant-key` header', async () => {
    // arrange
    const options = {
      tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      headers: {
      },
    };
    const jsonMock = jest.fn(() => ({}))
    fetchMock.mockResponse(() => Promise.resolve({ 
      ok: true, 
      status: 200, 
      statusText: 'OK', 
      json: jsonMock, 
      body: '{}' 
    }));
    // act
    const client = new ArthurClient(options);
    await client.query({ query: { startDate: 1, endDate: 2 } });
    // assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'arthur-tenant-key': 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
    });
  });

  test('should sanitize params and encode them properly, including arrays', async () => {
    // arrange
    const options = {
      tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      headers: {},
      params: {
        'param1': 'hello world',
        'param2': 'hello&world%',
        'param3': ['a', 'b', 'c'],
        'param4': true,
        'param5': 100,
        'param6': { value: 1 },
      },
    };
    const jsonMock = jest.fn(() => ({}))
    fetchMock.mockResponse(() => Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jsonMock,
      body: '{}'
    }));
    // act
    const client = new ArthurClient(options);
    await client.query({ query: { startDate: 1, endDate: 2 } });
    // assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(qs.parse(fetchMock.mock.calls[0][0].match(/\?(.*)/)[1])).toEqual({
      query: { startDate: '1', endDate: '2' },
      param1: 'hello world',
      param2: 'hello&world%',
      param3: ['a', 'b', 'c'],
      param4: 'true',
      param5: '100',
      param6: { value: '1' },
    });
  });

  test('should override the params.query with the passed query argument', async () => {
    // arrange
    const options = {
      tenant: 'a6edc906-2f9f-5fb2-a373-efac406f0ef2',
      headers: {},
      params: {
        'query': { value: 1 },
      },
    };
    const jsonMock = jest.fn(() => ({}))
    fetchMock.mockResponse(() => Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jsonMock,
      body: '{}'
    }));
    // act
    const client = new ArthurClient(options);
    await client.query({ query: { startDate: 1, endDate: 2 } });
    // assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(qs.parse(fetchMock.mock.calls[0][0].match(/\?(.*)/)[1])).toEqual({
      query: { startDate: '1', endDate: '2' },
    });
  })
})


