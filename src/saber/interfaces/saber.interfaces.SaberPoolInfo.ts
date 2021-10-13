export interface SaberPoolInfo {
        id: string,
        name: string,
        tokens: RegistryToken[],
        tokenIcons: RegistryToken[],
        underlyingIcons: RegistryToken[],
        currency: string,
        lpToken: RegistryToken,
        plotKey: string,
        swap: {
          config: {
            swapAccount: string,
            swapProgramID: string,
            tokenProgramID: string,
            authority: string
          },
          state: {
            adminAccount: string,
            tokenA: {
              adminFeeAccount: string,
              reserve: string,
              mint: string
            },
            tokenB: {
              adminFeeAccount: string,
              reserve: string,
              mint: string
            },
            poolTokenMint: string,
          }
        },
        quarry: string,
  }

export interface RegistryToken {
    chainId: number,
    address: string,
    symbol: string,
    name: string,
    decimals: number,
    logoURI: string,
    tags: string[],
    extensions: {
      website: string,
      coingeckoId: string,
      serumV3Usdc: string,
      currency: string,
      underlyingTokens: string[],
      source: string
    }
  }
