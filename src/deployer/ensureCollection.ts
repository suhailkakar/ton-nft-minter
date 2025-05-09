import TonWeb from 'tonweb' // should be on top
import { NftCollection as NftCollectionType } from 'tonweb/dist/types/contract/token/nft/nft-collection'

import { callTonApi } from '../utils'
import Deployer from './index'

const { NftItem, NftCollection } = TonWeb.token.nft

export async function ensureCollection(this: Deployer): Promise<NftCollectionType> {
  const walletAddress = await this.wallet.getAddress()

  if (!this.config.collection.collectionAddress) {
    throw new Error('[Deployer] Collection address must be provided')
  }

  this.log('[Deployer] Using collection: ' + this.config.collection.collectionAddress)

  const existingCollection = new NftCollection(this.tonweb.provider, {
    address: this.config.collection.collectionAddress,
    ownerAddress: walletAddress,
    royalty: 0,
    royaltyAddress: walletAddress,
    nftItemCodeHex: NftItem.codeHex,
  })

  try {
    const collectionData = await callTonApi<
      ReturnType<typeof existingCollection.getCollectionData>
    >(() => existingCollection.getCollectionData())

    if (collectionData.nextItemIndex !== undefined) {
      this.log('[Deployer] Collection verified, next item index: ' + collectionData.nextItemIndex)
      return existingCollection
    } else {
      throw new Error('[Deployer] Collection data not found. Check the collection address')
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    throw new Error('[Deployer] Failed to verify collection: ' + errorMessage)
  }
}
