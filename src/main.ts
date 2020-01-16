import * as yargs from 'yargs';
import { Monitor, MqttMessageEvent } from './monitor';
import { tap, filter, map } from 'rxjs/operators';
import { timer } from 'rxjs';
import { Pinger } from './ping';
import { DHCPEvent, Tracker } from './tracker';

yargs
  .scriptName('main.ts')
  .command(
    'monitor',
    'Monitor MQTT messages',
    (yargs: yargs.Argv) => {},
    (args: any) => {
      const monitor = new Monitor(args.host);
      const tracker = new Tracker();

      tracker.observeDhcp(monitor);
      monitor.monitor();

      // timer(60000).subscribe(() => monitor.close());
      console.log('Done.');
    },
  )
  .option('host', { type: 'string', description: 'Host to connect to' }).argv;
