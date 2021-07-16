import { concurrentMap } from '@celo/base'
// import { CELO_DERIVATION_PATH_BASE } from '@celo/base/lib/account'
import { CeloContract, CeloTokenType, ContractKit, StableToken, Token } from '@celo/contractkit'
import { newExchange } from '@celo/contractkit/lib/generated/Exchange'
import { newStableToken } from '@celo/contractkit/lib/generated/StableToken'
import { ExchangeWrapper } from '@celo/contractkit/lib/wrappers/Exchange'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { generateKeys } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from './context'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

interface KeyInfo {
  address: string
  privateKey: string
  publicKey: string
}

export const StableTokenToRegistryName: Record<string, CeloContract> = {
  cUSD: CeloContract.StableToken,
  cEUR: 'StableTokenEUR' as CeloContract,
}

export const ExchangeToRegistryName: Record<string, CeloContract> = {
  cUSD: CeloContract.Exchange,
  cEUR: 'ExchangeEUR' as CeloContract,
}

export async function fundAccountWithCELO(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber
) {
  // Use validator 0 instead of root because it has a CELO balance
  const validator0 = await getValidatorKey(context.mnemonic, 0)
  return fundAccount(context, account, value, Token.CELO, validator0, true)
}

export async function fundAccountWithcUSD(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber
) {
  await fundAccountWithStableToken(context, account, value, StableToken.cUSD)
}

export async function fundAccountWithStableToken(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber,
  stableToken: string
) {
  return fundAccount(context, account, value, stableToken as StableToken)
}

async function fundAccount(
  context: EnvTestContext,
  account: TestAccounts,
  value: BigNumber,
  token: CeloTokenType,
  fromKey?: KeyInfo,
  isCELO: boolean = false
) {
  const from = fromKey ? fromKey : await getKey(context.mnemonic, TestAccounts.Root)
  const recipient = await getKey(context.mnemonic, account)
  const logger = context.logger.child({
    index: account,
    account: from.address,
    value: value.toString(),
    address: recipient.address,
  })
  context.kit.connection.addAccount(from.privateKey)

  const tokenWrapper = await context.kit.celoTokens.getWrapper(token)

  console.log('root', from.address)
  const rootBalance = await tokenWrapper.balanceOf(from.address)
  console.log('root balance', await context.kit.getTotalBalance(from.address))
  console.log('context.mnemonic', context.mnemonic)
  if (rootBalance.lte(value)) {
    logger.error({ rootBalance: rootBalance.toString() }, 'error funding test account')
    throw new Error(
      `From account ${from.address}'s /*stableToken*/ balance (${rootBalance.toPrecision(
        4
      )}) is not enough for transferring ${value.toPrecision(4)}`
    )
  }
  const receipt = await tokenWrapper
    .transfer(recipient.address, value.toString())
    .sendAndWaitForReceipt({
      from: from.address,
      feeCurrency: isCELO ? undefined : tokenWrapper.address,
    })

  logger.debug({ token, receipt }, `funded test account with /*stableToken*/`)
}

export async function getValidatorKey(mnemonic: string, index: number): Promise<KeyInfo> {
  return getKey(mnemonic, index, '')
}

export async function getKey(
  mnemonic: string,
  account: TestAccounts,
  derivationPath?: string
): Promise<KeyInfo> {
  const key = await generateKeys(mnemonic, undefined, 0, account, undefined, derivationPath)
  return { ...key, address: privateKeyToAddress(key.privateKey) }
}

export enum TestAccounts {
  Root,
  TransferFrom,
  TransferTo,
  Exchange,
  Oracle,
  GovernanceApprover,
  ReserveSpender,
  ReserveCustodian,
  GrandaMentoExchanger,
}

export const ONE = new BigNumber('1000000000000000000')

export async function clearAllFundsToRoot(context: EnvTestContext, stableTokensToClear: string[]) {
  const accounts = Array.from(
    new Array(Object.keys(TestAccounts).length / 2),
    (_val, index) => index
  )
  const root = await getKey(context.mnemonic, TestAccounts.Root)
  context.logger.debug({ account: root.address }, 'clear test fund accounts')
  const goldToken = await context.kit.contracts.getGoldToken()
  await concurrentMap(5, accounts, async (_val, index) => {
    if (index === 0) {
      return
    }
    const account = await getKey(context.mnemonic, index)
    context.kit.connection.addAccount(account.privateKey)

    const celoBalance = await goldToken.balanceOf(account.address)
    // Exchange and transfer tests move ~0.5, so setting the threshold slightly below
    const maxBalanceBeforeCollecting = ONE.times(0.4)
    if (celoBalance.gt(maxBalanceBeforeCollecting)) {
      await goldToken
        .transfer(
          root.address,
          celoBalance.times(0.99).integerValue(BigNumber.ROUND_DOWN).toString()
        )
        .sendAndWaitForReceipt({ from: account.address, feeCurrency: undefined })
      context.logger.debug(
        {
          index,
          value: celoBalance.toString(),
          address: account.address,
        },
        'cleared CELO'
      )
    }
    for (const stableToken of stableTokensToClear) {
      const stableTokenInstance = await initStableTokenFromRegistry(stableToken, context.kit)
      const balance = await stableTokenInstance.balanceOf(account.address)
      if (balance.gt(maxBalanceBeforeCollecting)) {
        await stableTokenInstance
          .transfer(root.address, balance.times(0.99).integerValue(BigNumber.ROUND_DOWN).toString())
          .sendAndWaitForReceipt({
            feeCurrency: stableTokenInstance.address,
            from: account.address,
          })
        const balanceAfter = await stableTokenInstance.balanceOf(account.address)
        context.logger.debug(
          {
            index,
            stabletoken: stableToken,
            balanceBefore: balance.toString(),
            address: account.address,
            BalanceAfter: balanceAfter.toString(),
          },
          `cleared ${stableToken}`
        )
      }
    }
  })
}

// This function creates an stabletoken instance from a registry address and the StableToken ABI and wraps it with StableTokenWrapper.
// It is required for cEUR testing until cEUR stabletoken wrapper is included in ContractKit.
// Function is supposed to be deprecated as soon as cEUR stabletoken is wrapped.
export async function initStableTokenFromRegistry(stableToken: string, kit: ContractKit) {
  const stableTokenAddress = await kit.registry.addressFor(StableTokenToRegistryName[stableToken])
  const stableTokenContract = newStableToken(kit.web3, stableTokenAddress)
  return new StableTokenWrapper(kit, stableTokenContract)
}

// This function creates an exchange instance from a registry address and the Exchange ABI and wraps it with ExchangeWrapper.
// It is required for cEUR testing until cEUR exchange wrapper is included in ContractKit.
// Function is supposed to be deprecated as soon as cEUR exchange is wrapped.
export async function initExchangeFromRegistry(stableToken: string, kit: ContractKit) {
  const exchangeAddress = await kit.registry.addressFor(ExchangeToRegistryName[stableToken])
  const exchangeContract = newExchange(kit.web3, exchangeAddress)
  return new ExchangeWrapper(kit, exchangeContract)
}
