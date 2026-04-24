export const DEFAULT_INITIA_CHAIN_ID =
  process.env.NEXT_PUBLIC_INITIA_CHAIN_ID ?? "initiation-2";

export const DEFAULT_INITIA_NETWORK =
  process.env.NEXT_PUBLIC_INITIA_NETWORK ?? "testnet";

export const DEFAULT_INITIA_PAYMENT_DENOM =
  process.env.NEXT_PUBLIC_INITIA_PAYMENT_DENOM ?? "uinit";

export const DEFAULT_INITIA_CHAIN_NAME =
  process.env.NEXT_PUBLIC_INITIA_CHAIN_NAME ?? "Initia Testnet";

export const DEFAULT_INITIA_BECH32_PREFIX =
  process.env.NEXT_PUBLIC_INITIA_BECH32_PREFIX ?? "init";

export const DEFAULT_INITIA_RPC_URL =
  process.env.NEXT_PUBLIC_INITIA_RPC_URL ?? "";

export const DEFAULT_INITIA_REST_URL =
  process.env.NEXT_PUBLIC_INITIA_REST_URL ?? "";

export const DEFAULT_INITIA_INDEXER_URL =
  process.env.NEXT_PUBLIC_INITIA_INDEXER_URL ?? DEFAULT_INITIA_REST_URL;

export const DEFAULT_INITIA_JSON_RPC_URL =
  process.env.NEXT_PUBLIC_INITIA_JSON_RPC_URL ?? "";

export const DEFAULT_INITIA_NATIVE_SYMBOL =
  process.env.NEXT_PUBLIC_INITIA_NATIVE_SYMBOL ?? "INIT";

export const DEFAULT_INITIA_NATIVE_DECIMALS = Number(
  process.env.NEXT_PUBLIC_INITIA_NATIVE_DECIMALS ?? "6",
);

export const DEFAULT_INITIA_VM_TYPE =
  process.env.NEXT_PUBLIC_INITIA_VM_TYPE ?? "minimove";

export const MINIMAL_SIMULATION_PAYMENT_AMOUNT =
  process.env.NEXT_PUBLIC_INITIA_MINIMAL_PAYMENT_AMOUNT ?? "1";

export function hasCustomInitiaChainConfig(): boolean {
  return Boolean(DEFAULT_INITIA_RPC_URL && DEFAULT_INITIA_REST_URL);
}

export function createCustomInitiaChain() {
  if (!hasCustomInitiaChainConfig()) {
    return undefined;
  }

  return {
    chain_id: DEFAULT_INITIA_CHAIN_ID,
    chain_name: DEFAULT_INITIA_CHAIN_NAME,
    pretty_name: DEFAULT_INITIA_CHAIN_NAME,
    network_type: DEFAULT_INITIA_NETWORK,
    bech32_prefix: DEFAULT_INITIA_BECH32_PREFIX,
    apis: {
      rpc: [{ address: DEFAULT_INITIA_RPC_URL }],
      rest: [{ address: DEFAULT_INITIA_REST_URL }],
      indexer: [{ address: DEFAULT_INITIA_INDEXER_URL }],
      ...(DEFAULT_INITIA_JSON_RPC_URL
        ? { "json-rpc": [{ address: DEFAULT_INITIA_JSON_RPC_URL }] }
        : {}),
    },
    fees: {
      fee_tokens: [
        {
          denom: DEFAULT_INITIA_PAYMENT_DENOM,
          fixed_min_gas_price: 0,
          low_gas_price: 0,
          average_gas_price: 0,
          high_gas_price: 0,
        },
      ],
    },
    staking: {
      staking_tokens: [{ denom: DEFAULT_INITIA_PAYMENT_DENOM }],
    },
    native_assets: [
      {
        denom: DEFAULT_INITIA_PAYMENT_DENOM,
        name: DEFAULT_INITIA_NATIVE_SYMBOL,
        symbol: DEFAULT_INITIA_NATIVE_SYMBOL,
        decimals: DEFAULT_INITIA_NATIVE_DECIMALS,
      },
    ],
    metadata: {
      is_l1: false,
      minitia: {
        type: DEFAULT_INITIA_VM_TYPE,
      },
    },
  };
}
