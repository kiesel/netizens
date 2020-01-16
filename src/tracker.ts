import { Monitor, MqttMessageEvent } from './monitor';
import { tap, filter, map } from 'rxjs/operators';
import { Pinger } from './ping';

export interface DHCPEvent {
  action: 'old' | 'new' | 'del';
  macaddr: string;
  ipaddr: string;
  hostname: string;
}

export interface Connection {
  dhcp: DHCPEvent;
  ping?: Pinger;
  online: boolean;
  lastChange?: Date;
}

export class Tracker {
  private devices: Map<string, Connection> = new Map();

  constructor() {}

  public observeDhcp(monitor: Monitor) {
    monitor
      .mqttEvents()
      .pipe(
        tap(event => console.log('New event', event)),
        filter(event => event.type === 'MESSAGE'),
        map((event: MqttMessageEvent) => JSON.parse(event.payload)),
      )
      .subscribe((msg: DHCPEvent) => {
        this.consumeDhcp(msg);
      });
  }

  private consumeDhcp(event: DHCPEvent) {
    if (event.action === 'del') {
      return this.removeDevice(event);
    }

    this.addDevice(event);
    this.startObservation(event.macaddr);
  }

  private addDevice(event: DHCPEvent) {
    if (!this.devices.has(event.macaddr)) {
      this.devices.set(event.macaddr, { dhcp: event, online: false });
    }

    const conn = this.devices.get(event.macaddr);
    conn!.dhcp = event;
  }

  private removeDevice(event: DHCPEvent) {
    const conn = this.devices.get(event.macaddr);
    if (!conn) {
      return;
    }

    conn.ping?.stop();
    this.devices.delete(event.macaddr);
  }

  private startObservation(macaddr: string) {
    const conn = this.devices.get(macaddr);
    if (!conn) {
      throw new Error(`No such device: ${macaddr}`);
    }

    conn.ping = new Pinger(conn.dhcp.ipaddr);
    conn.ping.observeConnection();
    conn.ping.statusChanged().subscribe(online => {
      conn.online = online;
      conn.lastChange = new Date();

      if (!online) {
        conn.ping?.stop();
        conn.ping = undefined;
      }

      console.log(conn);
    });
  }
}
