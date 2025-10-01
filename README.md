# RDF Connect Utility Processors

This package provides a set of **stream utility processors** for [RDF-Connect](https://w3id.org/rdf-connect#).
They handle common stream control patterns such as duplicating, merging, and buffering messages.  

Each processor is described in RDF (SHACL + RDF Connect vocab) and backed by a JavaScript implementation.

---

### 🔀 FanOutProcessor
**IRI:** `rdfc:FanOut`  
**Label:** *Fan Out Streams Processor*  
**Description:** Duplicates messages from a single reader into multiple writers.  
By default, messages are forwarded to all writers **in parallel**, but sequential mode is also supported.

**Arguments:**
- **reader** (`rdfc:Reader`, required): The input stream.  
- **writers** (`rdfc:Writer[]`): One or more output streams.  
- **parallel** (`xsd:boolean`, optional): If `true` (default), all writers are called concurrently; if `false`, writers are called in sequence.

**Use case:** Broadcasting one stream into multiple downstream consumers.

---

### 🔗 ConvergeProcessor
**IRI:** `rdfc:Converge`  
**Label:** *Stream Converging Processor*  
**Description:** Converges messages from multiple readers into a single writer.  
Useful when several upstream sources should flow into the same sink.

**Arguments:**
- **readers** (`rdfc:Reader[]`): One or more input streams.  
- **writer** (`rdfc:Writer`, required): The single output stream.  

**Behavior:**  
- Messages from readers are interleaved into the writer.  
- By default, processing is sequential per message to avoid concurrency conflicts.  
- Fairness or strict ordering can be tuned by implementation (e.g., queuing vs. racing).

**Use case:** Merging multiple producers into one consumer.

---

### 📦 BufferProcessor
**IRI:** `rdfc:Buffer`  
**Label:** *Stream Buffering Processor*  
**Description:** Buffers messages so that writers can produce faster than the consumer processes them.  
Allows up to **n messages** to be written in parallel before applying backpressure.

**Arguments:**
- **reader** (`rdfc:Reader`, required): The input stream.  
- **writer** (`rdfc:Writer`, required): The output stream.  
- **maxOngoing** (`xsd:integer`, required): Maximum number of chunks being processed concurrently.  

**Behavior:**  
- Reads chunks from the input and writes them to the output.  
- If `maxOngoing` is reached, the reader waits until one write finishes (`Promise.race` pattern).  
- Ensures throughput while controlling memory and concurrency.

**Use case:** Controlling backpressure and concurrency in high-throughput pipelines.

