import { Subject, Observable, interval, timer } from 'rxjs';
const ping = require('net-ping');

export interface DHCPEvent {
  action: 'old' | 'new' | 'del';
  macaddr: string;
  ipaddr: string;
  hostname: string;
}

export class ConnectionTracker {
  private _status: Subject<boolean> = new Subject();

  constructor(private dhcp: DHCPEvent) {}

  public statusChanged(): Observable<boolean> {
    return this._status.asObservable();
  }

  public observeConnection() {
    timer(1000, 5000).subscribe(() => {
      const session = ping.createSession();
      session.pingHost(this.dhcp.ipaddr, (error: Error, target: string) => {
        console.log(error, target);
        if (error) {
          this._status.next(false);
        }
      });
    });
  }
}
