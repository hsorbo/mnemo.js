import { Buffer } from 'buffer';
import { Command } from 'commander';
import { SerialPort } from 'serialport';

const program = new Command();

function sleep(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

program
  .command('import <tty>')
  .description('Import from a tty device.')
  .action(async (tty: string) => {

    function create_syn(date: Date) : Buffer {
      const syn = Buffer.alloc(6);
      syn.writeUInt8(0x43, 0);
      syn.writeUInt8(date.getFullYear() - 2000, 1);
      syn.writeUInt8(date.getMonth()+1, 2);
      syn.writeUInt8(date.getDate(), 3);
      syn.writeUInt8(date.getHours(), 4);
      syn.writeUInt8(date.getMinutes(), 5);
      return syn;
    }

    const port = new SerialPort({
      path: tty,
      baudRate: 9600,
      stopBits: 1,
      parity: 'none',
      dataBits: 8,
    });
    
    for (const c of create_syn(new Date())) {
      port.write([c]);
      await sleep(100);
      port.drain();
    }
    
    const chunks: Buffer[] = [];

    function done() {
      console.log(Buffer.concat(chunks));
      port.close();
    }
    
    let readTimeout = setTimeout(done, 1000);

    port.on('data', (data: Buffer) => {
      clearTimeout(readTimeout);
      readTimeout = setTimeout(done, 1000);
      chunks.push(data);
    });

  });

program.parse(process.argv);

