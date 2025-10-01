import { describe, expect, test } from "vitest";
import { checkProcDefinition, getProc } from "@rdfc/js-runner/lib/testUtils";

import { BufferProcessor, ConvergeProcessor, FanOutProcessor } from "../src";

describe("Template processor tests", async () => {

    test("rdfc:FanOut is properly defined", async () => {
        const processorConfig = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.

        <http://example.com/ns#processor> a rdfc:FanOut;
          rdfc:reader <jr>;
          rdfc:writer <jw>, <jw>;
          rdfc:inParallel false.
        `;

        const configLocation = process.cwd() + "/index.ttl";
        await checkProcDefinition(configLocation, "Buffer");

        const processor = await getProc<FanOutProcessor>(
            processorConfig,
            "FanOut",
            configLocation,
        );
        await processor.init();

        expect(processor.parallel).toBe(false);
        expect(processor.reader.constructor.name).toBe("ReaderInstance");
        expect(processor.writers.length).toBe(2);
        expect(processor.writers.map(r => r.constructor.name)).toEqual(["WriterInstance", "WriterInstance"]);
    });
    test("rdfc:Converge is properly defined", async () => {
        const processorConfig = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.

        <http://example.com/ns#processor> a rdfc:Converge;
          rdfc:reader <jr>, <jr>;
          rdfc:writer <jw>.
        `;

        const configLocation = process.cwd() + "/index.ttl";
        await checkProcDefinition(configLocation, "Buffer");

        const processor = await getProc<ConvergeProcessor>(
            processorConfig,
            "Converge",
            configLocation,
        );
        await processor.init();

        expect(processor.readers.length).toBe(2);
        expect(processor.readers.map(r => r.constructor.name)).toEqual(["ReaderInstance", "ReaderInstance"]);
        expect(processor.writer.constructor.name).toBe("WriterInstance");
    });
    test("rdfc:Buffer is properly defined", async () => {
        const processorConfig = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.

        <http://example.com/ns#processor> a rdfc:Buffer;
          rdfc:reader <jr>;
          rdfc:writer <jw>;
          rdfc:maxOngoing 5.
        `;

        const configLocation = process.cwd() + "/index.ttl";
        await checkProcDefinition(configLocation, "Buffer");

        const processor = await getProc<BufferProcessor>(
            processorConfig,
            "Buffer",
            configLocation,
        );
        await processor.init();

        expect(processor.reader.constructor.name).toBe("ReaderInstance");
        expect(processor.writer.constructor.name).toBe("WriterInstance");
        expect(processor.maxOngoing).toBe(5);
    });
});
