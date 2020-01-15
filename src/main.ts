import * as yargs from 'yargs';
import { Monitor } from './monitor';
import { timer } from 'rxjs';

yargs
  .scriptName('main.ts')
  .command(
    'monitor',
    'Monitor MQTT messages',
    (yargs: yargs.Argv) => {},
    (args: any) => {
      const monitor = new Monitor(args.host);

      monitor.mqttEvents().subscribe(event => console.log('New event', event));
      monitor.monitor();

      timer(60000).subscribe(() => monitor.close());
      console.log('Done.');
    },
  )
  .option('host', { type: 'string', description: 'Host to connect to' }).argv;
