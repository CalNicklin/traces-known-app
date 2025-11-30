/**
 * tRPC MCP Server
 *
 * Exposes tRPC procedure schemas to AI agents, enabling them to:
 * - Discover available procedures (queries, mutations)
 * - Understand input requirements for each procedure
 * - Learn output shapes for data binding
 * - Know which procedures require authentication
 */

// =============================================================================
// Procedure Registry
// =============================================================================

type ProcedureType = "query" | "mutation";

interface ProcedureFieldSchema {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  required?: boolean;
  minimum?: number;
  maximum?: number;
  format?: string;
  items?: ProcedureFieldSchema;
  properties?: Record<string, ProcedureFieldSchema>;
}

interface ProcedureSchema {
  procedure: string;
  router: string;
  type: ProcedureType;
  description: string;
  requiresAuth: boolean;
  input: {
    type: "object";
    properties: Record<string, ProcedureFieldSchema>;
    required: string[];
  };
  output: {
    type: string;
    description: string;
    properties?: Record<string, ProcedureFieldSchema>;
    items?: {
      type: string;
      properties: Record<string, ProcedureFieldSchema>;
    };
  };
  bindableFields: string[];
}

// =============================================================================
// Procedure Definitions
// =============================================================================

const PROCEDURE_SCHEMAS: ProcedureSchema[] = [
  // ============ Product Router ============
  {
    procedure: "product.search",
    router: "product",
    type: "query",
    description: "Search for products by name, brand, or barcode",
    requiresAuth: false,
    input: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query text" },
        page: { type: "number", minimum: 1, default: 1, description: "Page number" },
        limit: { type: "number", minimum: 1, maximum: 50, default: 10, description: "Results per page" },
      },
      required: ["query"],
    },
    output: {
      type: "array",
      description: "Array of matching products",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Product ID" },
          name: { type: "string", description: "Product name" },
          brand: { type: "string", description: "Brand name" },
          barcode: { type: "string", description: "Product barcode" },
          riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"], description: "Allergen risk level" },
        },
      },
    },
    bindableFields: ["$.id", "$.name", "$.brand", "$.barcode", "$.riskLevel"],
  },
  {
    procedure: "product.byId",
    router: "product",
    type: "query",
    description: "Get a single product by ID",
    requiresAuth: false,
    input: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Product ID" },
      },
      required: ["id"],
    },
    output: {
      type: "object",
      description: "Product details or null if not found",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        brand: { type: "string" },
        barcode: { type: "string" },
        ingredients: { type: "string" },
        allergenWarning: { type: "string" },
        riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] },
      },
    },
    bindableFields: ["$.id", "$.name", "$.brand", "$.barcode", "$.ingredients", "$.allergenWarning", "$.riskLevel"],
  },
  {
    procedure: "product.detail",
    router: "product",
    type: "query",
    description: "Get detailed product info with stats",
    requiresAuth: false,
    input: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Product ID" },
      },
      required: ["id"],
    },
    output: {
      type: "object",
      description: "Product with aggregated report stats",
      properties: {
        product: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            brand: { type: "string" },
            allergenWarning: { type: "string" },
            riskLevel: { type: "string" },
          },
        },
        stats: {
          type: "object",
          properties: {
            totalReports: { type: "number" },
            lastReportedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    bindableFields: ["$.product.id", "$.product.name", "$.product.brand", "$.product.riskLevel", "$.stats.totalReports", "$.stats.lastReportedAt"],
  },

  // ============ Report Router ============
  {
    procedure: "report.create",
    router: "report",
    type: "mutation",
    description: "Create a new allergy reaction report",
    requiresAuth: true,
    input: {
      type: "object",
      properties: {
        productId: { type: "string", format: "uuid", description: "ID of the product that caused the reaction", required: true },
        severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"], default: "UNKNOWN", description: "Severity of the reaction" },
        symptoms: { type: "array", items: { type: "string" }, description: "List of symptoms experienced" },
        allergenIds: { type: "array", items: { type: "string", format: "uuid" }, description: "IDs of suspected allergens" },
        comment: { type: "string", description: "Additional details about the reaction" },
      },
      required: ["productId"],
    },
    output: {
      type: "object",
      description: "Created report",
      properties: {
        id: { type: "string", format: "uuid" },
        productId: { type: "string" },
        severity: { type: "string" },
        symptoms: { type: "array", items: { type: "string" } },
        comment: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    bindableFields: ["$.id", "$.productId", "$.severity", "$.symptoms", "$.comment", "$.createdAt"],
  },
  {
    procedure: "report.latest",
    router: "report",
    type: "query",
    description: "Get the most recent reports from all users",
    requiresAuth: false,
    input: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 50, default: 10, description: "Number of reports to return" },
      },
      required: [],
    },
    output: {
      type: "array",
      description: "Array of recent reports with product and user info",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          reportDate: { type: "string", format: "date-time" },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] },
          comment: { type: "string" },
          product: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    },
    bindableFields: ["$.id", "$.reportDate", "$.severity", "$.comment", "$.product.name", "$.user.name"],
  },
  {
    procedure: "report.mine",
    router: "report",
    type: "query",
    description: "Get the current user's reports",
    requiresAuth: true,
    input: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 50, default: 20, description: "Number of reports to return" },
      },
      required: [],
    },
    output: {
      type: "array",
      description: "Array of user's reports with product info",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          reportDate: { type: "string", format: "date-time" },
          severity: { type: "string" },
          comment: { type: "string" },
          product: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    },
    bindableFields: ["$.id", "$.reportDate", "$.severity", "$.comment", "$.product.name"],
  },
  {
    procedure: "report.byProductId",
    router: "report",
    type: "query",
    description: "Get all reports for a specific product",
    requiresAuth: false,
    input: {
      type: "object",
      properties: {
        productId: { type: "string", format: "uuid", description: "Product ID to get reports for" },
      },
      required: ["productId"],
    },
    output: {
      type: "array",
      description: "Array of reports for the product",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          reportDate: { type: "string", format: "date-time" },
          severity: { type: "string" },
          symptoms: { type: "array", items: { type: "string" } },
          comment: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    },
    bindableFields: ["$.id", "$.reportDate", "$.severity", "$.symptoms", "$.comment", "$.user.name"],
  },

  // ============ Allergen Router ============
  {
    procedure: "allergen.all",
    router: "allergen",
    type: "query",
    description: "Get all known allergens",
    requiresAuth: false,
    input: {
      type: "object",
      properties: {},
      required: [],
    },
    output: {
      type: "array",
      description: "Array of all allergens in the system",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", description: "Allergen name (e.g., 'Peanuts', 'Gluten')" },
          description: { type: "string" },
        },
      },
    },
    bindableFields: ["$.id", "$.name", "$.description"],
  },
  {
    procedure: "allergen.mine",
    router: "allergen",
    type: "query",
    description: "Get the current user's allergen preferences",
    requiresAuth: true,
    input: {
      type: "object",
      properties: {},
      required: [],
    },
    output: {
      type: "array",
      description: "Array of allergens the user is sensitive to",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
        },
      },
    },
    bindableFields: ["$.id", "$.name"],
  },
  {
    procedure: "allergen.setMine",
    router: "allergen",
    type: "mutation",
    description: "Update the current user's allergen preferences",
    requiresAuth: true,
    input: {
      type: "object",
      properties: {
        allergenIds: { type: "array", items: { type: "string", format: "uuid" }, description: "Array of allergen IDs the user is sensitive to" },
      },
      required: ["allergenIds"],
    },
    output: {
      type: "object",
      description: "Updated preferences confirmation",
      properties: {
        success: { type: "boolean" },
        count: { type: "number", description: "Number of allergens saved" },
      },
    },
    bindableFields: ["$.success", "$.count"],
  },

  // ============ Auth Router ============
  {
    procedure: "auth.getSession",
    router: "auth",
    type: "query",
    description: "Get the current user's session",
    requiresAuth: false,
    input: {
      type: "object",
      properties: {},
      required: [],
    },
    output: {
      type: "object",
      description: "Session with user info or null if not authenticated",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            image: { type: "string" },
          },
        },
        expires: { type: "string", format: "date-time" },
      },
    },
    bindableFields: ["$.user.id", "$.user.name", "$.user.email", "$.user.image"],
  },
];

// =============================================================================
// Router Metadata
// =============================================================================

interface RouterInfo {
  name: string;
  description: string;
  procedures: string[];
}

const ROUTERS: RouterInfo[] = [
  {
    name: "product",
    description: "Product search and details",
    procedures: ["product.search", "product.byId", "product.detail"],
  },
  {
    name: "report",
    description: "Allergy reaction reports",
    procedures: ["report.create", "report.latest", "report.mine", "report.byProductId"],
  },
  {
    name: "allergen",
    description: "Allergen data and user preferences",
    procedures: ["allergen.all", "allergen.mine", "allergen.setMine"],
  },
  {
    name: "auth",
    description: "Authentication and session management",
    procedures: ["auth.getSession"],
  },
];

// =============================================================================
// MCP Tool Implementations
// =============================================================================

/**
 * List all available procedures, optionally filtered by router
 */
export function listProcedures(router?: string): ProcedureSchema[] {
  return PROCEDURE_SCHEMAS.filter((p) => !router || p.router === router);
}

/**
 * Get detailed schema for a specific procedure
 */
export function getProcedure(name: string): ProcedureSchema | null {
  return PROCEDURE_SCHEMAS.find((p) => p.procedure === name) ?? null;
}

/**
 * Get output fields available for data binding
 */
export function getOutputFields(procedure: string): string[] {
  const schema = getProcedure(procedure);
  return schema?.bindableFields ?? [];
}

/**
 * List all routers with their procedures
 */
export function listRouters(): RouterInfo[] {
  return ROUTERS;
}

/**
 * Get form field recommendations based on procedure input schema
 * Maps procedure input fields to recommended SDUI form components
 */
export function getFormFieldsForProcedure(procedure: string): Array<{
  name: string;
  label: string;
  component: string;
  props: Record<string, unknown>;
  required: boolean;
}> {
  const schema = getProcedure(procedure);
  if (!schema) return [];

  const fields: Array<{
    name: string;
    label: string;
    component: string;
    props: Record<string, unknown>;
    required: boolean;
  }> = [];

  for (const [name, field] of Object.entries(schema.input.properties)) {
    const required = schema.input.required.includes(name);
    const label = field.description ?? formatFieldName(name);

    let component: string;
    let props: Record<string, unknown> = { name };

    if (field.enum) {
      component = "select";
      props.options = field.enum.map((value) => ({
        value,
        label: formatFieldName(value),
      }));
      props.placeholder = `Select ${label.toLowerCase()}`;
    } else if (field.type === "array" && field.items?.type === "string") {
      component = "textarea";
      props.placeholder = `Enter ${label.toLowerCase()}, one per line`;
      props.rows = 3;
    } else if (field.type === "string" && name.toLowerCase().includes("comment")) {
      component = "textarea";
      props.placeholder = field.description ?? `Enter ${label.toLowerCase()}`;
      props.rows = 3;
    } else if (field.type === "string" && name.toLowerCase().includes("description")) {
      component = "textarea";
      props.placeholder = field.description ?? `Enter ${label.toLowerCase()}`;
      props.rows = 4;
    } else if (field.type === "string" && field.format === "date-time") {
      component = "dateInput";
      props.placeholder = `Select ${label.toLowerCase()}`;
    } else if (field.type === "string" && field.format === "uuid") {
      component = "textInput";
      props.placeholder = field.description ?? `Enter ${label.toLowerCase()}`;
      props.inputType = "text";
    } else if (field.type === "number") {
      component = "textInput";
      props.inputType = "number";
      props.placeholder = field.description ?? `Enter ${label.toLowerCase()}`;
      if (field.minimum !== undefined) props.min = field.minimum;
      if (field.maximum !== undefined) props.max = field.maximum;
    } else if (field.type === "boolean") {
      component = "checkbox";
      props.label = label;
      if (field.default !== undefined) props.defaultChecked = field.default;
    } else {
      component = "textInput";
      props.inputType = "text";
      props.placeholder = field.description ?? `Enter ${label.toLowerCase()}`;
    }

    if (field.default !== undefined && component !== "checkbox") {
      props.defaultValue = field.default;
    }

    fields.push({ name, label, component, props, required });
  }

  return fields;
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

// =============================================================================
// MCP Resources
// =============================================================================

export const TRPC_MCP_RESOURCES = {
  "trpc://routers": () => listRouters(),
  "trpc://procedures": () => listProcedures(),
};

export const TRPC_MCP_TOOLS = {
  list_procedures: listProcedures,
  get_procedure: getProcedure,
  get_output_fields: getOutputFields,
  list_routers: listRouters,
  get_form_fields: getFormFieldsForProcedure,
};

