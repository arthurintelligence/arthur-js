import 'jest';
import ArthurClient, { ArthurClientContext } from './ArthurClient';

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
    expect(client.context).toEqual(context);
  });
});

// TODO: test query



