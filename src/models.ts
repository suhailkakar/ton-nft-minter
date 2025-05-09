export interface Config {
  walletMnemonic: string
  walletType: string
  walletAddress: string

  startIndex: number

  tonApiUrl: string
  tonApiKey?: string

  collection: {
    collectionAddress: string
  }

  topupAmount: string
}

export class Nft {
  public id: number
  public owner_address?: string
  public seqno?: number
  public address?: string
}
