---
meta:
  id: spec-alchemy-workspace-graph-v2-data-models-specification
  title: "Data Models"
  version: 0.1.0
  status: draft
  specType: specification
  scope: "product:spec-alchemy"
  createdBy: "Agent Alchemy Developer Agent"
  createdAt: '2026-03-20'
  category: Products
  feature: workspace-graph-v2
  phase: architecture
---

# Data Models Specification — workspace-graph-v2

| Field    | Value           |
| -------- | --------------- |
| version  | 1.0.0           |
| date     | 2026-03-20      |
| status   | Draft           |
| category | Architecture    |

---

## Executive Summary

The `workspace-graph-v2` feature extends the existing V1 graph model by introducing **7 new node types** and **6 new edge types**, enabling richer code-structure analysis and more precise MCP tool responses.

### V1 Baseline

V1 models **11 node types** (`project`, `file`, `class`, `service`, `component`, `controller`, `interface`, `type`, `enum`, `specification`, `guardrail`) connected by **9 edge types** (`contains`, `imports`, `specifies`, `enforces`, `depends-on`, `uses`, `inherits`, `implements`, `exports`). This captures module-level relationships but lacks granularity inside class bodies.

### V2 Additions

V2 introduces new node types that subsume V1 types with richer metadata.
V2 is a clean-slate refactor — the existing graph data is rebuilt from source, not merged with V1 data.

| Category  | New Types |
| --------- | --------- |
| Node types | `method`, `decorator`, `parameter`, `call-site`, `property`, `type-alias`, `namespace` |
| Edge types | `CALLS`, `OVERRIDES`, `DECORATES`, `DEFINES_METHOD`, `HAS_PARAMETER`, `HAS_PROPERTY` |

---

## Section 1: V2 Node Types

The following table enumerates all node types in the V2 schema.

| Node Type      | Description                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------- |
| `project`      | Root node representing an Nx workspace project (application or library).                   |
| `file`         | A single TypeScript, HTML, SCSS, JSON, or Markdown source file within a project.           |
| `class`        | A TypeScript `class` declaration that is not further categorised as service/component/etc. |
| `service`      | An Angular or NestJS service class decorated with `@Injectable()`.                         |
| `component`    | An Angular component class decorated with `@Component()`.                                  |
| `controller`   | A NestJS REST controller decorated with `@Controller()`.                                   |
| `interface`    | A TypeScript `interface` declaration.                                                       |
| `type`         | A TypeScript type literal or utility type alias. In V2 superseded by `type-alias`. |
| `enum`         | A TypeScript `enum` declaration.                                                    |
| `specification`| An Agent Alchemy specification file (`.specification.md`).                         |
| `guardrail`    | An Agent Alchemy guardrail file linked to specifications.                           |

---

## Section 2: New V2 Node Types

### 2.1 `method`

**Description:** Represents a method declaration or method signature within a class, interface, or abstract class. Tracks name, visibility, static flag, return type, and whether the method is abstract or async. Every `method` node has exactly one parent `class`, `service`, `component`, `controller`, or `interface` node connected via a `DEFINES_METHOD` edge.

**TypeScript Interface:**

```typescript
interface MethodNodeV2 {
  id: string;               // e.g. "method:UserService#getUserById"
  type: 'method';
  name: string;             // e.g. "getUserById"
  filePath: string;         // absolute path to the source file
  parentId: string;         // id of the containing class/interface node
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  isAbstract: boolean;
  isAsync: boolean;
  returnType: string;       // e.g. "Observable<User>"
  lineStart: number;
  lineEnd: number;
  signature: string;        // full signature string, e.g. "getUserById(id: number): Observable<User>"
  jsdoc?: string;           // extracted JSDoc comment if present
}
```

**When Created:** Emitted by the ts-morph extractor for every `MethodDeclaration` and `MethodSignature` encountered in class/interface bodies.

**Example:**

```json
{
  "id": "method:UserService#getUserById",
  "type": "method",
  "name": "getUserById",
  "filePath": "libs/shared/data-access/src/lib/user.service.ts",
  "parentId": "service:UserService",
  "visibility": "public",
  "isStatic": false,
  "isAbstract": false,
  "isAsync": false,
  "returnType": "Observable<User>",
  "lineStart": 42,
  "lineEnd": 55,
  "signature": "getUserById(id: number): Observable<User>"
}
```

---

### 2.2 `decorator`

**Description:** Represents a TypeScript decorator applied to a class, method, property, or parameter. Tracks the decorator name, target kind, and its arguments as a serialised string. Linked to its target via a `DECORATES` edge.

**TypeScript Interface:**

```typescript
interface DecoratorNodeV2 {
  id: string;               // e.g. "decorator:Component@UserListComponent"
  type: 'decorator';
  name: string;             // decorator name, e.g. "Component"
  filePath: string;
  targetId: string;         // id of the node this decorator targets
  targetKind: 'class' | 'method' | 'property' | 'parameter';
  arguments: string;        // JSON-serialised array of argument expressions
  lineStart: number;
}
```

**When Created:** Emitted whenever a `Decorator` node is encountered on a class, method, accessor, property, or parameter declaration.

**Example:**

```json
{
  "id": "decorator:Component@UserListComponent",
  "type": "decorator",
  "name": "Component",
  "filePath": "apps/agency/src/app/user-list/user-list.component.ts",
  "targetId": "component:UserListComponent",
  "targetKind": "class",
  "arguments": "[{\"selector\":\"app-user-list\",\"templateUrl\":\"./user-list.component.html\"}]",
  "lineStart": 8
}
```

---

### 2.3 `parameter`

**Description:** Represents a single parameter within a method, constructor, or function signature. Tracks the parameter name, type annotation, optional/rest flags, and whether it carries a constructor-promotion modifier. Linked to its parent method via a `HAS_PARAMETER` edge.

**TypeScript Interface:**

```typescript
interface ParameterNodeV2 {
  id: string;               // e.g. "param:UserService#getUserById#id"
  type: 'parameter';
  name: string;             // parameter name, e.g. "id"
  filePath: string;
  parentMethodId: string;   // id of the containing method node
  parameterType: string;    // TypeScript type string, e.g. "number"
  isOptional: boolean;
  isRest: boolean;
  hasDefault: boolean;
  defaultValue?: string;    // serialised default expression if present
  position: number;         // 0-indexed position in parameter list
  lineStart: number;
}
```

**When Created:** Emitted for each `ParameterDeclaration` child of a `MethodDeclaration`, `Constructor`, or `FunctionDeclaration`.

**Example:**

```json
{
  "id": "param:UserService#getUserById#id",
  "type": "parameter",
  "name": "id",
  "filePath": "libs/shared/data-access/src/lib/user.service.ts",
  "parentMethodId": "method:UserService#getUserById",
  "parameterType": "number",
  "isOptional": false,
  "isRest": false,
  "hasDefault": false,
  "position": 0,
  "lineStart": 42
}
```

---

### 2.4 `call-site`

**Description:** Represents a specific location in the code where one method or function calls another. Call-site nodes capture the caller, the callee reference, file location, and argument count. They are connected via a `CALLS` edge from caller method to callee method.

**TypeScript Interface:**

```typescript
interface CallSiteNodeV2 {
  id: string;               // e.g. "callsite:UserService#create->UserRepository#save:67"
  type: 'call-site';
  filePath: string;
  callerMethodId: string;   // id of the method node that contains this call
  calleeReference: string;  // best-effort resolved reference, e.g. "UserRepository#save"
  calleeMethodId?: string;  // resolved method node id if resolvable, else undefined
  lineStart: number;
  columnStart: number;
  argumentCount: number;
  expressionText: string;   // raw call expression text, e.g. "this.repository.save(user)"
}
```

**When Created:** Emitted for each `CallExpression` found within a method body during ts-morph traversal.

**Example:**

```json
{
  "id": "callsite:UserService#create->UserRepository#save:67",
  "type": "call-site",
  "filePath": "libs/shared/data-access/src/lib/user.service.ts",
  "callerMethodId": "method:UserService#create",
  "calleeReference": "UserRepository#save",
  "calleeMethodId": "method:UserRepository#save",
  "lineStart": 67,
  "columnStart": 12,
  "argumentCount": 1,
  "expressionText": "this.userRepository.save(user)"
}
```

---

### 2.5 `property`

**Description:** Represents a property declaration within a class or interface. Tracks visibility, type, optional flag, readonly flag, and whether it is a constructor-promoted parameter. Linked to its parent via a `HAS_PROPERTY` edge.

**TypeScript Interface:**

```typescript
interface PropertyNodeV2 {
  id: string;               // e.g. "property:UserService#http"
  type: 'property';
  name: string;             // e.g. "http"
  filePath: string;
  parentId: string;         // id of the containing class/interface node
  propertyType: string;     // TypeScript type string, e.g. "HttpClient"
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  isReadonly: boolean;
  isOptional: boolean;
  isConstructorPromotion: boolean;
  initializer?: string;     // serialised initializer expression if present
  lineStart: number;
  jsdoc?: string;
}
```

**When Created:** Emitted for each `PropertyDeclaration` and `PropertySignature` encountered in class/interface bodies.

**Example:**

```json
{
  "id": "property:UserService#http",
  "type": "property",
  "name": "http",
  "filePath": "libs/shared/data-access/src/lib/user.service.ts",
  "parentId": "service:UserService",
  "propertyType": "HttpClient",
  "visibility": "private",
  "isStatic": false,
  "isReadonly": true,
  "isOptional": false,
  "isConstructorPromotion": true,
  "lineStart": 18
}
```

---

### 2.6 `type-alias`

**Description:** Represents a `type` alias declaration in TypeScript (`type Foo = ...`). This is more detailed than the V1 `type` node — it captures the full resolved structure and supports complex mapped/conditional types. The V1 `type` node is retained for backwards compatibility, but new extractions use `type-alias`.

**TypeScript Interface:**

```typescript
interface TypeAliasNodeV2 {
  id: string;               // e.g. "type-alias:UserResponseDto"
  type: 'type-alias';
  name: string;             // e.g. "UserResponseDto"
  filePath: string;
  typeParameters: string[]; // generic type parameter names, e.g. ["T", "K"]
  typeText: string;         // full type expression as string
  isExported: boolean;
  lineStart: number;
  lineEnd: number;
  jsdoc?: string;
}
```

**When Created:** Emitted for each `TypeAliasDeclaration` encountered during file analysis.

**Example:**

```json
{
  "id": "type-alias:UserResponseDto",
  "type": "type-alias",
  "name": "UserResponseDto",
  "filePath": "libs/shared/models/src/lib/user-response.dto.ts",
  "typeParameters": [],
  "typeText": "{ id: number; email: string; firstName: string; lastName: string }",
  "isExported": true,
  "lineStart": 12,
  "lineEnd": 17
}
```

---

### 2.7 `namespace`

**Description:** Represents a TypeScript `namespace` (module) declaration. Namespaces may contain classes, interfaces, enums, type aliases, or nested namespaces. They are linked to contained declarations via standard `contains` edges.

**TypeScript Interface:**

```typescript
interface NamespaceNodeV2 {
  id: string;               // e.g. "namespace:ApiContracts"
  type: 'namespace';
  name: string;             // e.g. "ApiContracts"
  filePath: string;
  isAmbient: boolean;       // true if declared with `declare namespace`
  isExported: boolean;
  parentNamespaceId?: string; // id of parent namespace if nested
  lineStart: number;
  lineEnd: number;
}
```

**When Created:** Emitted for each `ModuleDeclaration` where the declaration kind is `namespace` or `module` (non-external modules).

**Example:**

```json
{
  "id": "namespace:ApiContracts",
  "type": "namespace",
  "name": "ApiContracts",
  "filePath": "libs/shared/models/src/lib/api-contracts.ts",
  "isAmbient": false,
  "isExported": true,
  "lineStart": 1,
  "lineEnd": 85
}
```

---

## Section 3: Complete GraphNodeV2 Union Type

The union type below covers all 18 node types (11 from V1 + 7 new V2 types):

```typescript
// V1 node interfaces (abbreviated — full definitions in v1 schema)
interface ProjectNode    { id: string; type: 'project';        name: string; root: string; projectType: 'application' | 'library'; tags: string[] }
interface FileNode       { id: string; type: 'file';           name: string; filePath: string; extension: string; linesOfCode: number }
interface ClassNode      { id: string; type: 'class';          name: string; filePath: string; isAbstract: boolean; isExported: boolean }
interface ServiceNode    { id: string; type: 'service';        name: string; filePath: string; providedIn: string }
interface ComponentNode  { id: string; type: 'component';      name: string; filePath: string; selector: string; changeDetection: string }
interface ControllerNode { id: string; type: 'controller';     name: string; filePath: string; routePrefix: string }
interface InterfaceNode  { id: string; type: 'interface';      name: string; filePath: string; isExported: boolean }
interface TypeNodeV1     { id: string; type: 'type';           name: string; filePath: string; typeText: string }
interface EnumNode       { id: string; type: 'enum';           name: string; filePath: string; members: string[]; isConst: boolean }
interface SpecNode       { id: string; type: 'specification';  name: string; filePath: string; specId: string; specVersion: string }
interface GuardrailNode  { id: string; type: 'guardrail';      name: string; filePath: string; guardId: string }

// V2 new node types (full definitions in Section 2)
// MethodNodeV2, DecoratorNodeV2, ParameterNodeV2, CallSiteNodeV2,
// PropertyNodeV2, TypeAliasNodeV2, NamespaceNodeV2

export type GraphNodeV2 =
  // --- Structural node types ---
  | ProjectNode
  | FileNode
  | ClassNode
  | ServiceNode
  | ComponentNode
  | ControllerNode
  | InterfaceNode
  | TypeNodeV1
  | EnumNode
  | SpecNode
  | GuardrailNode
  // --- V2 new types ---
  | MethodNodeV2
  | DecoratorNodeV2
  | ParameterNodeV2
  | CallSiteNodeV2
  | PropertyNodeV2
  | TypeAliasNodeV2
  | NamespaceNodeV2;

export type NodeType = GraphNodeV2['type'];

export const ALL_NODE_TYPES: NodeType[] = [
  // V1
  'project', 'file', 'class', 'service', 'component',
  'controller', 'interface', 'type', 'enum', 'specification', 'guardrail',
  // V2
  'method', 'decorator', 'parameter', 'call-site',
  'property', 'type-alias', 'namespace',
];

export const V2_ONLY_NODE_TYPES: NodeType[] = [
  'method', 'decorator', 'parameter', 'call-site',
  'property', 'type-alias', 'namespace',
];
```

---

## Section 4: V2 Edge Types

The following edge types are part of the V2 schema. Core structural edge types carry forward from the prior design; new V2 edge types (`CALLS`, `OVERRIDES`, `DECORATES`, `DEFINES_METHOD`, `HAS_PARAMETER`, `HAS_PROPERTY`) are added.

| Edge Type    | Source Node Type(s)                        | Target Node Type(s)                        | Description                                                                 |
| ------------ | ------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------- |
| `contains`   | `project`, `file`, `namespace`             | `file`, `class`, `service`, `component`, `enum`, `interface` | Parent–child structural containment. |
| `imports`    | `file`                                     | `file`                                     | TypeScript `import` statement from one file to another.                     |
| `specifies`  | `specification`                            | `class`, `service`, `component`, `interface` | A spec file describes the contract of a code artefact.                   |
| `enforces`   | `guardrail`                                | `specification`                            | A guardrail rule enforces a specification.                                  |
| `depends-on` | `project`                                  | `project`                                  | Nx project-level dependency (from `project.json` or `nx.json`).            |
| `uses`       | `class`, `service`, `component`, `controller` | `service`, `class`, `interface`         | Runtime dependency — a class uses another via constructor injection or DI. |
| `inherits`   | `class`, `service`, `component`            | `class`, `service`                         | TypeScript `extends` relationship.                                          |
| `implements` | `class`, `service`, `component`            | `interface`                                | TypeScript `implements` relationship.                                       |
| `exports`    | `file`                                     | `class`, `service`, `component`, `enum`, `interface`, `type` | A file re-exports a symbol. |

---

## Section 5: New V2 Edge Types

### 5.1 `CALLS`

**Description:** Connects a `method` node (caller) to another `method` node (callee) via a call-site. Where a `call-site` node exists, the `CALLS` edge references it in metadata. This edge enables call-graph traversal and impact analysis.

**TypeScript Interface:**

```typescript
interface CallsEdgeV2 {
  id: string;               // e.g. "edge:CALLS:method:UserService#create->method:UserRepository#save"
  type: 'CALLS';
  sourceId: string;         // caller method node id
  targetId: string;         // callee method node id
  callSiteId?: string;      // id of the associated call-site node if available
  callCount: number;        // number of call-sites from source to target in this method
}
```

**Example:**

```json
{
  "id": "edge:CALLS:method:UserService#create->method:UserRepository#save",
  "type": "CALLS",
  "sourceId": "method:UserService#create",
  "targetId": "method:UserRepository#save",
  "callSiteId": "callsite:UserService#create->UserRepository#save:67",
  "callCount": 1
}
```

---

### 5.2 `OVERRIDES`

**Description:** Connects a `method` node in a subclass to the `method` node it overrides in a parent class or interface. Enables override chain analysis and abstract method implementation tracking.

**TypeScript Interface:**

```typescript
interface OverridesEdgeV2 {
  id: string;               // e.g. "edge:OVERRIDES:method:AdminService#create->method:BaseService#create"
  type: 'OVERRIDES';
  sourceId: string;         // overriding method node id
  targetId: string;         // overridden method node id (in parent class or interface)
  isConcrete: boolean;      // true if overriding an abstract method
}
```

**Example:**

```json
{
  "id": "edge:OVERRIDES:method:AdminService#create->method:BaseService#create",
  "type": "OVERRIDES",
  "sourceId": "method:AdminService#create",
  "targetId": "method:BaseService#create",
  "isConcrete": true
}
```

---

### 5.3 `DECORATES`

**Description:** Connects a `decorator` node to the node it decorates (class, method, property, or parameter). This is the primary link used to query "which classes are decorated with X?" or "what decorators does this method have?".

**TypeScript Interface:**

```typescript
interface DecoratesEdgeV2 {
  id: string;               // e.g. "edge:DECORATES:decorator:Injectable@UserService->service:UserService"
  type: 'DECORATES';
  sourceId: string;         // decorator node id
  targetId: string;         // decorated node id
  targetKind: 'class' | 'method' | 'property' | 'parameter';
}
```

**Example:**

```json
{
  "id": "edge:DECORATES:decorator:Injectable@UserService->service:UserService",
  "type": "DECORATES",
  "sourceId": "decorator:Injectable@UserService",
  "targetId": "service:UserService",
  "targetKind": "class"
}
```

---

### 5.4 `DEFINES_METHOD`

**Description:** Connects a class or interface node to its method nodes. This is the structural ownership edge — every method node has exactly one `DEFINES_METHOD` edge pointing to it from its parent.

**TypeScript Interface:**

```typescript
interface DefinesMethodEdgeV2 {
  id: string;               // e.g. "edge:DEFINES_METHOD:service:UserService->method:UserService#getUserById"
  type: 'DEFINES_METHOD';
  sourceId: string;         // parent class/interface/service/component node id
  targetId: string;         // method node id
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
}
```

**Example:**

```json
{
  "id": "edge:DEFINES_METHOD:service:UserService->method:UserService#getUserById",
  "type": "DEFINES_METHOD",
  "sourceId": "service:UserService",
  "targetId": "method:UserService#getUserById",
  "visibility": "public",
  "isStatic": false
}
```

---

### 5.5 `HAS_PARAMETER`

**Description:** Connects a `method` node to each of its `parameter` nodes. Ordered by parameter position. Enables signature inspection and parameter-type queries.

**TypeScript Interface:**

```typescript
interface HasParameterEdgeV2 {
  id: string;               // e.g. "edge:HAS_PARAMETER:method:UserService#getUserById->param:UserService#getUserById#id"
  type: 'HAS_PARAMETER';
  sourceId: string;         // method node id
  targetId: string;         // parameter node id
  position: number;         // 0-indexed position in parameter list
}
```

**Example:**

```json
{
  "id": "edge:HAS_PARAMETER:method:UserService#getUserById->param:UserService#getUserById#id",
  "type": "HAS_PARAMETER",
  "sourceId": "method:UserService#getUserById",
  "targetId": "param:UserService#getUserById#id",
  "position": 0
}
```

---

### 5.6 `HAS_PROPERTY`

**Description:** Connects a class or interface node to each of its `property` nodes. Preserves ownership and enables property-type queries.

**TypeScript Interface:**

```typescript
interface HasPropertyEdgeV2 {
  id: string;               // e.g. "edge:HAS_PROPERTY:service:UserService->property:UserService#http"
  type: 'HAS_PROPERTY';
  sourceId: string;         // parent class/interface/service/component node id
  targetId: string;         // property node id
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
}
```

**Example:**

```json
{
  "id": "edge:HAS_PROPERTY:service:UserService->property:UserService#http",
  "type": "HAS_PROPERTY",
  "sourceId": "service:UserService",
  "targetId": "property:UserService#http",
  "visibility": "private",
  "isStatic": false
}
```

---

## Section 6: Complete GraphEdgeV2 Union Type

```typescript
// V1 edge interfaces (abbreviated)
interface ContainsEdge   { id: string; type: 'contains';   sourceId: string; targetId: string }
interface ImportsEdge    { id: string; type: 'imports';    sourceId: string; targetId: string; importedSymbols: string[] }
interface SpecifiesEdge  { id: string; type: 'specifies';  sourceId: string; targetId: string }
interface EnforcesEdge   { id: string; type: 'enforces';   sourceId: string; targetId: string }
interface DependsOnEdge  { id: string; type: 'depends-on'; sourceId: string; targetId: string; dependencyType: string }
interface UsesEdge       { id: string; type: 'uses';       sourceId: string; targetId: string }
interface InheritsEdge   { id: string; type: 'inherits';   sourceId: string; targetId: string }
interface ImplementsEdge { id: string; type: 'implements'; sourceId: string; targetId: string }
interface ExportsEdge    { id: string; type: 'exports';    sourceId: string; targetId: string; exportedSymbol: string }

export type GraphEdgeV2 =
  // --- Core edge types ---
  | ContainsEdge
  | ImportsEdge
  | SpecifiesEdge
  | EnforcesEdge
  | DependsOnEdge
  | UsesEdge
  | InheritsEdge
  | ImplementsEdge
  | ExportsEdge
  // --- V2 new edge types ---
  | CallsEdgeV2
  | OverridesEdgeV2
  | DecoratesEdgeV2
  | DefinesMethodEdgeV2
  | HasParameterEdgeV2
  | HasPropertyEdgeV2;

export type EdgeType = GraphEdgeV2['type'];

export const ALL_EDGE_TYPES: EdgeType[] = [
  // V1
  'contains', 'imports', 'specifies', 'enforces',
  'depends-on', 'uses', 'inherits', 'implements', 'exports',
  // V2
  'CALLS', 'OVERRIDES', 'DECORATES', 'DEFINES_METHOD',
  'HAS_PARAMETER', 'HAS_PROPERTY',
];

export const V2_ONLY_EDGE_TYPES: EdgeType[] = [
  'CALLS', 'OVERRIDES', 'DECORATES', 'DEFINES_METHOD',
  'HAS_PARAMETER', 'HAS_PROPERTY',
];
```

---

## Section 7: Full WorkspaceGraphV2 Schema

```typescript
/**
 * The root schema for the V2 workspace graph.
 * Serialised as JSON to disk and loaded into memory as Maps for performance.
 */
export interface WorkspaceGraphV2 {
  /** Schema version string — must be "2.0.0" for V2 graphs */
  schemaVersion: '2.0.0';

  /** ISO-8601 timestamp of when this graph was last fully built */
  builtAt: string;

  /** Absolute path to the Nx workspace root */
  workspaceRoot: string;

  /** Total count of source files analysed during last full build */
  fileCount: number;

  /** Nodes keyed by node id for O(1) lookup */
  nodes: Record<string, GraphNodeV2>;

  /** Edges keyed by edge id */
  edges: Record<string, GraphEdgeV2>;

  /**
   * Adjacency index: maps each node id to arrays of outgoing and incoming edge ids.
   * Rebuilt in-memory on load; not persisted to JSON.
   */
  adjacency?: {
    outgoing: Record<string, string[]>;
    incoming: Record<string, string[]>;
  };

  /** Index of file path -> node id for files, rebuilt in-memory on load */
  fileIndex?: Record<string, string>;

  /** Metadata about the last incremental update, if applicable */
  lastIncrementalUpdate?: {
    updatedAt: string;
    changedFiles: string[];
    addedNodeCount: number;
    removedNodeCount: number;
    addedEdgeCount: number;
    removedEdgeCount: number;
  };
}

/**
 * In-memory runtime representation with Map-based indexes for performance.
 */
export interface WorkspaceGraphV2Runtime {
  meta: Omit<WorkspaceGraphV2, 'nodes' | 'edges' | 'adjacency' | 'fileIndex'>;
  nodes: Map<string, GraphNodeV2>;
  edges: Map<string, GraphEdgeV2>;
  outgoing: Map<string, Set<string>>;  // nodeId -> Set of edge ids
  incoming: Map<string, Set<string>>;  // nodeId -> Set of edge ids
  fileIndex: Map<string, string>;      // filePath -> node id
  typeIndex: Map<NodeType, Set<string>>; // nodeType -> Set of node ids
}
```

---

## Section 8: SQLite Schema for V2

The SQLite store persists the graph for MCP server fast-path queries and survives process restarts without a full rebuild.

```sql
-- Enable WAL mode for better concurrent read performance
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ----------------------------------------------------------------
-- nodes_v2 table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nodes_v2 (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL,
  name          TEXT NOT NULL,
  file_path     TEXT,
  parent_id     TEXT,
  data          TEXT NOT NULL,   -- Full JSON blob of the node
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_nodes_v2_type     ON nodes_v2 (type);
CREATE INDEX IF NOT EXISTS idx_nodes_v2_file     ON nodes_v2 (file_path);
CREATE INDEX IF NOT EXISTS idx_nodes_v2_parent   ON nodes_v2 (parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_v2_name     ON nodes_v2 (name);

-- ----------------------------------------------------------------
-- edges_v2 table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS edges_v2 (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL,
  source_id     TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  data          TEXT NOT NULL,   -- Full JSON blob of the edge
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (source_id) REFERENCES nodes_v2 (id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES nodes_v2 (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_edges_v2_type     ON edges_v2 (type);
CREATE INDEX IF NOT EXISTS idx_edges_v2_source   ON edges_v2 (source_id);
CREATE INDEX IF NOT EXISTS idx_edges_v2_target   ON edges_v2 (target_id);
CREATE INDEX IF NOT EXISTS idx_edges_v2_src_type ON edges_v2 (source_id, type);
CREATE INDEX IF NOT EXISTS idx_edges_v2_tgt_type ON edges_v2 (target_id, type);

-- ----------------------------------------------------------------
-- search_index table (for MiniSearch pre-warm and fallback)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_index (
  node_id       TEXT PRIMARY KEY NOT NULL,
  node_type     TEXT NOT NULL,
  name          TEXT NOT NULL,
  file_path     TEXT,
  description   TEXT,            -- Extracted from JSDoc or spec frontmatter
  keywords      TEXT,            -- Space-separated keyword tokens
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (node_id) REFERENCES nodes_v2 (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_name      ON search_index (name);
CREATE INDEX IF NOT EXISTS idx_search_node_type ON search_index (node_type);

-- Full-text search via FTS5
CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
  node_id UNINDEXED,
  name,
  description,
  keywords,
  file_path,
  content='search_index',
  content_rowid='rowid'
);

-- ----------------------------------------------------------------
-- graph_meta table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS graph_meta (
  key           TEXT PRIMARY KEY NOT NULL,
  value         TEXT NOT NULL,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR REPLACE INTO graph_meta (key, value) VALUES ('schema_version', '2.0.0');
```

---

## Section 9: JSON Export Format

The full-graph export is a single JSON file (`.workspace-graph-v2.json`) written to the workspace root. It uses the `WorkspaceGraphV2` interface from Section 7.

**Sample JSON (abbreviated — 2 nodes, 1 edge):**

```json
{
  "schemaVersion": "2.0.0",
  "builtAt": "2026-03-20T10:00:00.000Z",
  "workspaceRoot": "/home/runner/work/my-workspace",
  "fileCount": 312,
  "nodes": {
    "service:UserService": {
      "id": "service:UserService",
      "type": "service",
      "name": "UserService",
      "filePath": "libs/shared/data-access/src/lib/user.service.ts",
      "providedIn": "root"
    },
    "method:UserService#getUserById": {
      "id": "method:UserService#getUserById",
      "type": "method",
      "name": "getUserById",
      "filePath": "libs/shared/data-access/src/lib/user.service.ts",
      "parentId": "service:UserService",
      "visibility": "public",
      "isStatic": false,
      "isAbstract": false,
      "isAsync": false,
      "returnType": "Observable<User>",
      "lineStart": 42,
      "lineEnd": 55,
      "signature": "getUserById(id: number): Observable<User>"
    }
  },
  "edges": {
    "edge:DEFINES_METHOD:service:UserService->method:UserService#getUserById": {
      "id": "edge:DEFINES_METHOD:service:UserService->method:UserService#getUserById",
      "type": "DEFINES_METHOD",
      "sourceId": "service:UserService",
      "targetId": "method:UserService#getUserById",
      "visibility": "public",
      "isStatic": false
    }
  }
}
```

**File path convention:**

```
<workspaceRoot>/.workspace-graph-v2.json        # full export
<workspaceRoot>/.workspace-graph-v2.db          # SQLite store
<workspaceRoot>/.workspace-graph-v2-index.json  # MiniSearch serialised index
```

---

## Section 10: Migration Strategy from V1 to V2

### 10.1 Migration Overview

V1 graphs are stored at `.workspace-graph.json` (or `.workspace-graph.db` for SQLite). The V2 migration runner:

1. Reads the existing V1 graph.
2. Re-processes all source files through the V2 extractor to produce new node/edge types.
3. Merges V1 nodes (preserving ids and existing edges) with new V2 nodes.
4. Writes the resulting V2 graph to `.workspace-graph-v2.json` and `.workspace-graph-v2.db`.
5. Leaves the V1 files untouched (non-destructive).

### 10.2 Detailed Steps

| Step | Action | Notes |
| ---- | ------ | ----- |
| 1    | Load V1 graph JSON | Validate `schemaVersion === '1.0.0'` |
| 2    | Create `WorkspaceGraphV2` scaffold | Set `schemaVersion: '2.0.0'`, copy `workspaceRoot` |
| 3    | Copy all V1 nodes verbatim | Node ids are stable across versions |
| 4    | Copy all V1 edges verbatim | Edge ids are stable across versions |
| 5    | Run V2 ts-morph extractor over all files | Emits V2-only nodes and edges |
| 6    | Merge V2 extractions into graph | Deduplicate by id; V2 wins on conflict |
| 7    | Build adjacency indexes | O(n) pass over all edges |
---

## Section 10: Graph Build Strategy

### 10.1 Build Overview

V2 always builds the graph from source — there is no migration from a V1 `graph.json`.
`WorkspaceGraphBuilderV2` processes TypeScript source files using the TypeScript Compiler API
and writes the result to `dist/workspace-graph/graph.json` (V2 schema only).

| Step | Action | Notes |
| ---- | ------ | ----- |
| 1    | Discover TypeScript source files | Via `tsconfig.base.json` + include/exclude patterns |
| 2    | Run `AstExtractor` per file | Emits V2 nodes and edges for each file |
| 3    | Build adjacency indexes | O(n) pass over all edges |
| 4    | Write `graph.json` | Atomic write via temp file + rename |
| 5    | Populate SQLite (optional) | Batched INSERT OR REPLACE |
| 6    | Build MiniSearch index (optional) | Serialise to `graph-index.json` |

### 10.2 V2 Builder TypeScript Stub

```typescript
// src/lib/builder/workspace-graph-builder-v2.ts
import * as ts from 'typescript';
import { AstExtractor } from '../ast/ast-extractor';
import { WorkspaceGraphV2 } from '../types';

export interface V2BuilderConfig {
  workspaceRoot: string;
  tsConfigPath: string;
  outputPath: string;
  excludePatterns?: string[];
}

export class WorkspaceGraphBuilderV2 {
  constructor(private readonly config: V2BuilderConfig) {}

  async buildFull(): Promise<WorkspaceGraphV2> {
    const program = ts.createProgram([this.config.tsConfigPath], {});
    const extractor = new AstExtractor();
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    for (const sourceFile of program.getSourceFiles()) {
      if (this.shouldExclude(sourceFile.fileName)) continue;
      const result = extractor.extract(sourceFile.fileName);
      result.nodes.forEach(n => nodes.set(n.id, n));
      edges.push(...result.edges);
    }

    return {
      schemaVersion: '2.0.0',
      builtAt: new Date().toISOString(),
      workspaceRoot: this.config.workspaceRoot,
      nodes,
      edges,
    };
  }

  private shouldExclude(filePath: string): boolean {
    return (this.config.excludePatterns ?? []).some(p => filePath.includes(p));
  }
}
```

---

## Section 11: Validation Rules

### 11.1 Validation Rules Table

| Rule ID | Severity | Description |
| ------- | -------- | ----------- |
| `V2-N-001` | Error   | Every node must have a non-empty `id` string. |
| `V2-N-002` | Error   | Every node `type` must be a value in `ALL_NODE_TYPES`. |
| `V2-N-003` | Warning | Every `method` node must have a corresponding `DEFINES_METHOD` edge. |
| `V2-N-004` | Error   | Every `parameter` node must have a `parentMethodId` that references an existing `method` node. |
| `V2-N-005` | Warning | Every `call-site` node must have a `callerMethodId` that references an existing `method` node. |
| `V2-N-006` | Error   | Every `property` node must have a `parentId` that references an existing class-like node. |
| `V2-N-007` | Warning | Every `decorator` node should have a corresponding `DECORATES` edge. |
| `V2-E-001` | Error   | Every edge `sourceId` must reference an existing node. |
| `V2-E-002` | Error   | Every edge `targetId` must reference an existing node. |
| `V2-E-003` | Error   | `CALLS` edges must have `sourceId` and `targetId` of type `method`. |
| `V2-E-004` | Error   | `DEFINES_METHOD` edge `targetId` must reference a `method` node. |
| `V2-E-005` | Error   | `HAS_PARAMETER` edge `targetId` must reference a `parameter` node. |
| `V2-E-006` | Error   | `HAS_PROPERTY` edge `targetId` must reference a `property` node. |
| `V2-G-001` | Warning | Graph must not contain cycles in `inherits` edges. |
| `V2-G-002` | Info    | Method nodes without any `HAS_PARAMETER` edge are valid (zero-parameter methods). |

### 11.2 GraphValidatorV2 TypeScript Interface

```typescript
export interface ValidationIssue {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: ValidationIssue[];
}

export interface GraphValidatorV2 {
  /**
   * Validates all nodes and edges in the provided graph.
   * Returns a ValidationResult summarising all issues found.
   */
  validate(graph: WorkspaceGraphV2): ValidationResult;

  /**
   * Validates a single node against all applicable node rules.
   */
  validateNode(node: GraphNodeV2, graph: WorkspaceGraphV2): ValidationIssue[];

  /**
   * Validates a single edge against all applicable edge rules.
   */
  validateEdge(edge: GraphEdgeV2, graph: WorkspaceGraphV2): ValidationIssue[];

  /**
   * Validates structural graph-level invariants (e.g. cycle detection).
   */
  validateStructure(graph: WorkspaceGraphV2): ValidationIssue[];
}

/**
 * Default implementation reference — full implementation in
 * libs/spec-alchemy/graph-engine/src/lib/validation/graph-validator-v2.ts
 */
export class DefaultGraphValidatorV2 implements GraphValidatorV2 {
  validate(graph: WorkspaceGraphV2): ValidationResult {
    const issues: ValidationIssue[] = [
      ...this.validateAllNodes(graph),
      ...this.validateAllEdges(graph),
      ...this.validateStructure(graph),
    ];
    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      errorCount: issues.filter(i => i.severity === 'error').length,
      warningCount: issues.filter(i => i.severity === 'warning').length,
      infoCount: issues.filter(i => i.severity === 'info').length,
      issues,
    };
  }

  validateNode(node: GraphNodeV2, graph: WorkspaceGraphV2): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!node.id) {
      issues.push({ ruleId: 'V2-N-001', severity: 'error', message: 'Node id is empty', nodeId: node.id });
    }
    if (!ALL_NODE_TYPES.includes(node.type)) {
      issues.push({ ruleId: 'V2-N-002', severity: 'error', message: `Unknown node type: ${node.type}`, nodeId: node.id });
    }
    // Additional per-type rules applied here...
    void graph; // suppress unused warning in stub
    return issues;
  }

  validateEdge(edge: GraphEdgeV2, graph: WorkspaceGraphV2): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!graph.nodes[edge.sourceId]) {
      issues.push({ ruleId: 'V2-E-001', severity: 'error', message: `Edge source not found: ${edge.sourceId}`, edgeId: edge.id });
    }
    if (!graph.nodes[edge.targetId]) {
      issues.push({ ruleId: 'V2-E-002', severity: 'error', message: `Edge target not found: ${edge.targetId}`, edgeId: edge.id });
    }
    return issues;
  }

  validateStructure(graph: WorkspaceGraphV2): ValidationIssue[] {
    // Cycle detection on `inherits` edges via DFS
    void graph;
    return [];
  }

  private validateAllNodes(graph: WorkspaceGraphV2): ValidationIssue[] {
    return Object.values(graph.nodes).flatMap(n => this.validateNode(n, graph));
  }

  private validateAllEdges(graph: WorkspaceGraphV2): ValidationIssue[] {
    return Object.values(graph.edges).flatMap(e => this.validateEdge(e, graph));
  }
}
```

---

*End of Data Models Specification — workspace-graph-v2*
