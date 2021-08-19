import { Connection } from '@celo/connect'
import { sendTransactionWithPrivateKey } from '@celo/protocol/lib/web3-utils'
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

    //Use connection to send transactions from local, secure wallet to unsecure address on node
    const web3: Web3 = new Web3('http://127.0.0.1:8545')
    const connection = new Connection(web3, new LocalWallet())

    //Get the address of and unlock burner account created in contracts-release.yml
    var burnerAddress: string
    const accounts = await connection.getAccounts()
    burnerAddress = accounts[accounts.length - 1]

    if (argv[0] != 'staging') {
      connection.addAccount(argv.key)

      await web3.eth.personal.unlockAccount(burnerAddress, 'A', 0, function (err) {
        if (err) {
          console.log('Error accessing burner address!')
        }
      })

      //Send transaction from secure local wallet to burner account on node
      await sendTransactionWithPrivateKey(
        web3,
        null,
        '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d',
        {
          to: burnerAddress,
          value: '10000000000000000000',
          gasPrice: '100000000000',
        }
      )
    }

    //Save address of burner account in text file so it can be passed to make-release.sh as input
    const fs = require('fs')
    fs.writeFileSync('../../burner.txt', burnerAddress)

    callback()
  } catch (error) {
    callback(error)
  }
}
