import * as mqtt from 'mqtt';
import { Subject } from 'rxjs';

interface AbstractMqttEvent {
  type: 'CONNECTION' | 'MESSAGE' | 'SUBSCRIPTION';
}

export interface MqttConnectionEvent extends AbstractMqttEvent {
  type: 'CONNECTION';
  connected: boolean;
}

export interface MqttSubscriptionEvent extends AbstractMqttEvent {
  type: 'SUBSCRIPTION';
  subscribed: boolean;
  topic: string;
}

export interface MqttMessageEvent extends AbstractMqttEvent {
  type: 'MESSAGE';
  topic: string;
  payload: string;
}

export type MqttEvent = MqttConnectionEvent | MqttMessageEvent | MqttSubscriptionEvent;

export class Monitor {
  private mqtt: mqtt.MqttClient;

  private _mqttEvents: Subject<MqttEvent> = new Subject();

  constructor(private host: string) {}

  public mqttEvents() {
    return this._mqttEvents.asObservable();
  }

  public monitor() {
    this.connect();
  }

  public close() {
    this.mqtt.end();
  }

  private connect() {
    this.mqtt = mqtt.connect(`mqtt://${this.host}`);
    this.mqtt.on('message', (topic: string, payload: Buffer) => {
      this._mqttEvents.next({
        type: 'MESSAGE',
        topic,
        payload: payload.toString(),
      });
    });

    this.mqtt.on('connect', () => {
      this._mqttEvents.next({ type: 'CONNECTION', connected: true });

      this.subscribe('network/eggleo/dhcp');
    });

    this.mqtt.on('end', () => this._mqttEvents.next({ type: 'CONNECTION', connected: false }));
  }

  private subscribe(topic: string) {
    this.mqtt.subscribe(topic, { qos: 0 }, () => {
      this._mqttEvents.next({ type: 'SUBSCRIPTION', subscribed: true, topic });
    });
  }
}
