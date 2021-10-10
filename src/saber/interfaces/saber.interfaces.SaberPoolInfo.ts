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
            // initialAmpFactor: 03e8,
            // targetAmpFactor: 03e8,
            // startRampTimestamp: 0,
            // stopRampTimestamp: 0,
            // fees: {
            //   adminTrade: {
            //     formatted: 0.0000000000,
            //     numerator: 0,
            //     denominator: 10000000
            //   },
            //   adminWithdraw: {
            //     formatted: 50.0000000000,
            //     numerator: 5000000,
            //     denominator: 10000000
            //   },
            //   trade: {
            //     formatted: 0.0399900000,
            //     numerator: 3999,
            //     denominator: 10000000
            //   },
            //   withdraw: {
            //     formatted: 0.5000000000,
            //     numerator: 50000,
            //     denominator: 10000000
            //   }
            // }
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
