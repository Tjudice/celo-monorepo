import { switchToClusterFromEnv } from 'src/lib/cluster'
import { failIfVmBased } from 'src/lib/env-utils'
import {
  isCelotoolHelmDryRun,
  resetAndUpgradeHelmChart,
  upgradeHelmChart,
  upgradeStaticIPs,
} from 'src/lib/helm_deploy'
import {
  uploadEnvFileToGoogleStorage,
  uploadTestnetStaticNodesToGoogleStorage,
} from 'src/lib/testnet-utils'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'testnet'
export const describe = 'upgrade an existing deploy of the testnet package'

type TestnetArgv = UpgradeArgv & {
  reset: boolean
  useExistingGenesis: boolean
  overwriteGCSFiles: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('reset', {
      describe: 'deletes any chain data in persistent volume claims',
      default: false,
      type: 'boolean',
    })
    .option('useExistingGenesis', {
      type: 'boolean',
      description: 'Instead of generating a new genesis, use an existing genesis in GCS',
      default: false,
    })
    .option('overwriteGCSFiles', {
      type: 'boolean',
      description: 'Force upload to GCS of newly generated genesis and static-nodes files',
      default: false,
    })
}

export const handler = async (argv: TestnetArgv) => {
  failIfVmBased()

  await switchToClusterFromEnv(argv.celoEnv)

  await upgradeStaticIPs(argv.celoEnv)

  if (argv.reset === true) {
    await resetAndUpgradeHelmChart(argv.celoEnv, argv.useExistingGenesis)
  } else {
    await upgradeHelmChart(argv.celoEnv, argv.useExistingGenesis, argv.overwriteGCSFiles)
  }
  if (!isCelotoolHelmDryRun()) {
    await uploadTestnetStaticNodesToGoogleStorage(argv.celoEnv)
    await uploadEnvFileToGoogleStorage(argv.celoEnv)
  }
}
