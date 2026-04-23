"use client";

import { PropsWithChildren, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InterwovenKitProvider, TESTNET, injectStyles } from "@initia/interwovenkit-react";
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

import { DEFAULT_INITIA_CHAIN_ID, DEFAULT_INITIA_NETWORK } from "@/lib/initia";

injectStyles(interwovenKitStyles);

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={DEFAULT_INITIA_CHAIN_ID}
          enableAutoSign={{
            [DEFAULT_INITIA_CHAIN_ID]: ["/cosmos.bank.v1beta1.MsgSend"],
          }}
        >
          <div data-initia-network={DEFAULT_INITIA_NETWORK}>{children}</div>
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
