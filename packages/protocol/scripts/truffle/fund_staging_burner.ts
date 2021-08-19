import { Connection } from '@celo/connect'
import { LocalWallet } from '@celo/wallet-local'
import Web3 from 'web3'

/*
 * A script that funds a burner account used to deploy release contracts with CELO on a given network
 *
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/fund_burner_accounts \
 *   --network alfajores --key 0x0000000000000000000000000000000000000000000000000000000000000000
 *   --amount 1000000000000000000
 */

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['key', 'amount'],
    })

    console.log(argv.key)

    //Use connection to send transactions from local, secure wallet to unsecure address on node
    const web3: Web3 = new Web3('http://127.0.0.1:8545')
    const connection = new Connection(web3, new LocalWallet())

    //Get the address of and unlock burner account created in contracts-release.yml
    var burnerAddress: string
    const accounts = await connection.getAccounts()
    burnerAddress = accounts[accounts.length - 1]

    const fs = require('fs')
    fs.writeFileSync('../../burner.txt', burnerAddress)

    callback()
  } catch (error) {
    callback(error)
  }
}
