import * as yargs from 'yargs';
import { Monitor, MqttMessageEvent } from './monitor';
import { tap, filter, map } from 'rxjs/operators';
import { timer } from 'rxjs';
import { ConnectionTracker, DHCPEvent } from './ping';

yargs
  .scriptName('main.ts')
  .command(
    'monitor',
    'Monitor MQTT messages',
    (yargs: yargs.Argv) => {},
    (args: any) => {
      const monitor = new Monitor(args.host);
      const devices = new Map<string, ConnectionTracker>();

      monitor
        .mqttEvents()
        .pipe(
          tap(event => console.log('New event', event)),
          filter(event => event.type === 'MESSAGE'),
          map((event: MqttMessageEvent) => JSON.parse(event.payload)),
        )
        .subscribe((msg: DHCPEvent) => {
          if (!devices.has(msg.macaddr)) {
            const tracker = new ConnectionTracker(msg);
            tracker.observeConnection();
            devices.set(msg.macaddr, tracker);
          }
        });
      monitor.monitor();

      timer(60000).subscribe(() => monitor.close());
      console.log('Done.');
    },
  )
  .option('host', { type: 'string', description: 'Host to connect to' }).argv;
