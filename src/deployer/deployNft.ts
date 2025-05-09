import TonWeb from 'tonweb'
import { callTonApi, delay, isNftExists } from '../utils'
import { NftCollection as NftCollectionType } from 'tonweb/dist/types/contract/token/nft/nft-collection'

import Deployer from './index'

const { NftItem } = TonWeb.token.nft

export async function deployNft(this: Deployer, nftCollection: NftCollectionType) {
  if (!nftCollection.address) {
    throw new Error('[Deployer] Corrupt nft collection')
  }

  const toDeploy = this.nfts[this.deployIndex]

  await this.ensureDeployerBalance()
  await this.ensureCollectionBalance(nftCollection)
  await this.ensurePreviousNftExists(nftCollection, toDeploy.id)

  this.log(`[Deployer] NFT deploy started ${toDeploy.id} ${toDeploy.owner_address || ''}`)

  const nftItemAddress = await callTonApi<
    ReturnType<typeof nftCollection.getNftItemAddressByIndex>
  >(() => nftCollection.getNftItemAddressByIndex(toDeploy.id))
  const nftItem = new NftItem(this.tonweb.provider, {
    address: nftItemAddress,
  })

  const exists = await isNftExists(this.tonweb, nftCollection, toDeploy.id)
  if (exists) {
    this.log(`[Deployer] NFT item already exists ${toDeploy.id}`)
    this.deployIndex++
    return
  }

  const amount = TonWeb.utils.toNano('0.05')
  const walletAddress = await this.wallet.getAddress()

  const seqno = toDeploy.seqno ? toDeploy.seqno : await callTonApi(this.wallet.methods.seqno().call)

  if (typeof seqno !== 'number' || seqno === 0) {
    throw new Error('[Deployer] No seqno found')
  }

  await callTonApi(
    this.wallet.methods.transfer({
      secretKey: this.key.secretKey,
      toAddress: nftCollection.address,
      amount,
      seqno,
      payload: await nftCollection.createMintBody({
        amount,
        itemIndex: toDeploy.id,
        itemOwnerAddress: toDeploy.owner_address
          ? new TonWeb.utils.Address(toDeploy.owner_address)
          : walletAddress,
        itemContentUri: `${toDeploy.id}.json`,
      }),
      sendMode: 3,
    }).send
  )

  if (!toDeploy.seqno) {
    toDeploy.seqno = seqno
  }

  await this.ensureSeqnoInc(seqno)

  await delay(8000)

  const itemInfo = await callTonApi<ReturnType<typeof nftCollection.getNftItemContent>>(() =>
    nftCollection.getNftItemContent(nftItem)
  )

  if (!itemInfo) {
    throw new Error(`[Deployer] no nft item info ${toDeploy.id}`)
  }
  if (!itemInfo.ownerAddress) {
    throw itemInfo
  }

  this.deployIndex++
  this.log(`[Deployer] NFT deployed ${toDeploy.id}`)
}
