import { describe, expect, test } from "vitest";
import { ProcHelper } from "@rdfc/js-runner/lib/testUtils";
import * as path from "path";

import { BufferProcessor, ConvergeProcessor, FanOutProcessor } from "../src";

const configLocation = path.resolve("./index.ttl");

describe("Stream utils processor tests", async () => {
    test("rdfc:FanOut is properly defined", async () => {
        const processorConfig = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.

        <http://example.com/ns#processor> a rdfc:FanOut;
          rdfc:reader <jr>;
          rdfc:writer <jw1>, <jw2>;
          rdfc:inParallel false.
        `;

        const helper = new ProcHelper<FanOutProcessor>();
        await helper.importFile(configLocation);
        await helper.importInline(
            path.resolve("pipeline.ttl"),
            processorConfig,
        );
        const config = helper.getConfig("FanOut");

        expect(config.location).toBeDefined();
        expect(config.file).toBeDefined();
        expect(config.clazz).toEqual("FanOutProcessor");

        const processor = await helper.getProcessor(
            "http://example.com/ns#processor",
        );

        expect(processor.parallel).toBe(false);
        expect(processor.reader.constructor.name).toBe("ReaderInstance");
        expect(processor.writers.length).toBe(2);
        expect(processor.writers.map((r) => r.constructor.name)).toEqual([
            "WriterInstance",
            "WriterInstance",
        ]);
    });

    test("rdfc:FanOut falls back to its default values", async () => {
        const processorConfig = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.

        <http://example.com/ns#processor> a rdfc:FanOut;
          rdfc:reader <jr>;
          rdfc:writer <jw>.
        `;

        const helper = new ProcHelper<FanOutProcessor>();
        await helper.importFile(configLocation);
        await helper.importInline(
            path.resolve("pipeline.ttl"),
            processorConfig,
        );
        helper.getConfig("FanOut");

        const processor = await helper.getProcessor(
            "http://example.com/ns#processor",
        );

        expect(processor.parallel).toBe(true);
        expect(processor.writers.length).toBe(1);
    });

    test("rdfc:Converge is properly defined", async () => {
        const processorConfig = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.

        <http://example.com/ns#processor> a rdfc:Converge;
          rdfc:reader <jr1>, <jr2>;
          rdfc:writer <jw>.
        `;

        const helper = new ProcHelper<ConvergeProcessor>();
        await helper.importFile(configLocation);
        await helper.importInline(
            path.resolve("pipeline.ttl"),
            processorConfig,
        );
        const config = helper.getConfig("Converge");

        expect(config.clazz).toEqual("ConvergeProcessor");

        const processor = await helper.getProcessor(
            "http://example.com/ns#processor",
        );

        expect(processor.readers.length).toBe(2);
        expect(processor.readers.map((r) => r.constructor.name)).toEqual([
            "ReaderInstance",
            "ReaderInstance",
        ]);
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

        const helper = new ProcHelper<BufferProcessor>();
        await helper.importFile(configLocation);
        await helper.importInline(
            path.resolve("pipeline.ttl"),
            processorConfig,
        );
        const config = helper.getConfig("Buffer");

        expect(config.clazz).toEqual("BufferProcessor");

        const processor = await helper.getProcessor(
            "http://example.com/ns#processor",
        );

        expect(processor.reader.constructor.name).toBe("ReaderInstance");
        expect(processor.writer.constructor.name).toBe("WriterInstance");
        expect(processor.maxOngoing).toBe(5);
    });
});
