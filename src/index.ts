import { Any, Processor, type Reader, type Writer } from "@rdfc/js-runner";

type FanOutArgs = {
    reader: Reader;
    writers: Writer[];
    parallel: boolean;
};

export class FanOutProcessor extends Processor<FanOutArgs> {
    async init(this: FanOutArgs & this): Promise<void> {
        this.parallel = this.parallel ?? true;
    }
    async transform(this: FanOutArgs & this): Promise<void> {
        for await (const any of this.reader.anys()) {
            if (this.parallel) {
                await this.sendParallel(any);
            } else {
                await this.sendInSequence(any);
            }
        }

        await Promise.all(this.writers.map(writer => writer.close()));
    }

    async sendParallel(this: FanOutArgs & this, chunk: Any) {
        await Promise.all(
            this.writers.map(writer => writer.any(chunk))
        )
    }

    async sendInSequence(this: FanOutArgs & this, chunk: Any) {
        for (const writer of this.writers) {
            await writer.any(chunk);
        }
    }

    async produce(this: FanOutArgs & this): Promise<void> {
    }

}


type ConvergeArgs = {
    readers: Reader[];
    writer: Writer;
}

export class ConvergeProcessor extends Processor<ConvergeArgs> {
    private readonly queue: (() => Promise<void>)[] = []
    private busy = false;
    async init(this: ConvergeArgs & this): Promise<void> {
    }
    async transform(this: ConvergeArgs & this): Promise<void> {
        await Promise.all(
            this.readers.map(reader => this.setupReader(reader))
        )
        await this.writer.close();
    }

    private async setupReader(this: ConvergeArgs & this, reader: Reader) {
        for await (const chunk of reader.anys()) {
            if (this.busy) {
                // We are busy, lets add it to the queue
                await new Promise<void>(res => {
                    this.queue.push(async () => {
                        await this.processChunk(chunk);
                        res();
                    });
                });
            } else {
                await this.processChunk(chunk);
            }
        }
    }

    private async processChunk(this: ConvergeArgs & this, chunk: Any) {
        this.busy = true;
        await this.writer.any(chunk)
        this.busy = false;
        // Process next item in queue if available
        const next = this.queue.shift();
        if (next) {
            // Fire and forget; queue promise resolves itself
            next();
        }
    }

    async produce(this: ConvergeArgs & this): Promise<void> {
    }
}

type BufferArgs = {
    reader: Reader,
    writer: Writer,
    maxOngoing: number,
}


export class BufferProcessor extends Processor<BufferArgs> {
    private ongoing = new Set<Promise<void>>();

    async init(this: BufferArgs & this): Promise<void> {
        // Nothing to initialize
    }

    async transform(this: BufferArgs & this): Promise<void> {
        for await (const chunk of this.reader.anys()) {
            // If too many ongoing writes, wait for one to finish
            if (this.maxOngoing !== 0 && this.ongoing.size >= this.maxOngoing) {
                await Promise.race(this.ongoing);
            }

            const task = this.writer.any(chunk)
                .catch(err => {
                    // Handle errors so they don't cause unhandled rejections
                    console.error("Writer error:", err);
                    throw err;
                })
                .finally(() => {
                    this.ongoing.delete(task);
                });

            this.ongoing.add(task);
        }

        // Wait for all pending writes to finish
        await Promise.all(this.ongoing);
        await this.writer.close();
    }

    async produce(this: BufferArgs & this): Promise<void> {
        // Nothing to produce
    }
}
