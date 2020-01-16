import { Subject, Observable, interval, timer, Subscription } from 'rxjs';
const ping = require('net-ping');

export interface ConnectionStatus {
  macaddr: string;
  ipaddr: string;
  hostname: string;
  onlineStatus: boolean;
}

export class Pinger {
  private status?: boolean;
  private _status: Subject<boolean> = new Subject();
  private subscription?: Subscription;

  constructor(private ipaddr: string) {}

  public statusChanged(): Observable<boolean> {
    return this._status.asObservable();
  }

  public observeConnection() {
    this.subscription = timer(1000, 60000).subscribe(() => {
      const session = ping.createSession({});
      session.pingHost(this.ipaddr, (error: Error, target: string) => {
        if (error) {
          this.notify(false);
          this.subscription?.unsubscribe();
        }

        this.notify(true);
      });
    });
  }

  public stop() {
    this.subscription?.unsubscribe();
  }

  private notify(onlineStatus: boolean) {
    if (this.status === onlineStatus) {
      return;
    }

    this.status = onlineStatus;
    this._status.next(onlineStatus);
  }
}
