"use client";

import { PropsWithChildren, useEffect, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InterwovenKitProvider, TESTNET, injectStyles } from "@initia/interwovenkit-react";
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

import {
  DEFAULT_INITIA_CHAIN_ID,
  DEFAULT_INITIA_NETWORK,
  createCustomInitiaChain,
} from "@/lib/initia";

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const customChain = createCustomInitiaChain();

  useEffect(() => {
    injectStyles(interwovenKitStyles);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={DEFAULT_INITIA_CHAIN_ID}
          customChain={customChain}
        >
          <div data-initia-network={DEFAULT_INITIA_NETWORK}>{children}</div>
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
