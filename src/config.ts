import { validateMnemonic } from 'tonweb-mnemonic'
import { Config } from './models'

export async function getConfig(): Promise<Config> {
  const c = {
    walletMnemonic: process.env.WALLET_MNEMONIC || '',
    walletType: process.env.WALLET_TYPE || '',
    walletAddress: process.env.WALLET_ADDRESS || '',

    startIndex: process.env.START_INDEX ? parseInt(process.env.START_INDEX, 10) : -1,

    tonApiUrl: process.env.TON_API_URL || 'https://toncenter.com/api/v2/jsonRPC',
    tonApiKey: process.env.TON_API_KEY,

    collection: {
      collectionAddress: process.env.COLLECTION_ADDRESS || '',
    },

    topupAmount: process.env.TOPUP_AMOUNT || '1',
  }

  await checkConfig(c)

  return c
}

export async function checkConfig(c: Config) {
  if (!c.walletMnemonic) {
    throw new Error('[Config] WalletMnemonic error')
  } else {
    const words = c.walletMnemonic.split(' ')

    const isValid = await validateMnemonic(words)
    if (!isValid) {
      throw new Error('[Config] Unknown mnemonic error')
    }
  }

  if (!c.walletType) {
    throw new Error('[Config] WalletType error')
  } else if (
    c.walletType !== 'v3R1' &&
    c.walletType !== 'v3R2' &&
    c.walletType !== 'v4R1' &&
    c.walletType !== 'v4R2'
  ) {
    throw new Error('[Config] WalletType unknown error')
  }

  if (Number.isNaN(c.startIndex)) {
    throw new Error('[Config] Start index not specified. Use -1 for auto detection')
  } else if (c.startIndex < -1) {
    throw new Error('[Config] Start index less than -1. Use -1 for auto detection')
  }

  if (!c.tonApiKey) {
    throw new Error('[Config] TonApiKey error')
  }

  if (!c.collection.collectionAddress) {
    throw new Error('[Config] Collection address must be provided')
  }

  const fTopupAmount = parseFloat(c.topupAmount)
  if (isNaN(fTopupAmount)) {
    throw new Error('[Config] Topup amount is NaN')
  } else if (fTopupAmount < 0.1) {
    throw new Error('[Config] Topup amount is less than 0.1')
  }
}
