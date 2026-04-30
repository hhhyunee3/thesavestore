var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form2 = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form2[key] = value;
    } else {
      handleParsingAllValues(form2, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form2).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form2, key, value);
        delete form2[key];
      }
    });
  }
  return form2;
}
var handleParsingAllValues = (form2, key, value) => {
  if (form2[key] !== void 0) {
    if (Array.isArray(form2[key])) {
      ;
      form2[key].push(value);
    } else {
      form2[key] = [form2[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form2[key] = value;
    } else {
      form2[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form2, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form2;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var escapeRe = /[&<>'"]/;
var stringBufferToString = async (buffer, callbacks) => {
  let str = "";
  callbacks ||= [];
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1; ; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
};
var escapeToBuffer = (str, buffer) => {
  const match2 = str.search(escapeRe);
  if (match2 === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match2; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
};
var resolveCallbackSync = (str) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html2, arg, headers) => {
    const res = (html22) => this.#newResponse(html22, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html2 === "object" ? resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html2);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input2, requestInit, Env, executionCtx) => {
    if (input2 instanceof Request) {
      return this.fetch(requestInit ? new Request(input2, requestInit) : input2, Env, executionCtx);
    }
    input2 = input2.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input2) ? input2 : `http://localhost${mergePath("/", input2)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/styles.ts
var globalStyles = `
:root {
  --white: #FFFFFF;
  --ivory: #FAF8F3;
  --black: #000000;
  --brown: #3D2817;
  --brown-deep: #2A1B0F;
  --orange: #FF5500;
  --orange-deep: #DD4400;
  --orange-tint: #FFE6DC;
  --muted: #666666;
  --muted-light: #999999;
  --line: #EEEEEE;
  --radius-sm: 100px;
  --radius-md: 16px;
  --radius-lg: 24px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: 'Pretendard Variable', Pretendard, -apple-system, sans-serif;
  background: var(--white);
  color: var(--black);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

img { max-width: 100%; display: block; }
.mono { font-family: 'Bricolage Grotesque', sans-serif; }

.container { max-width: 1280px; margin: 0 auto; padding: 0 32px; }

/* TOP BAR */
.topbar { background: var(--brown); color: var(--white); font-size: 12px; padding: 9px 0; letter-spacing: -0.01em; }
.topbar-inner { display: flex; justify-content: space-between; align-items: center; }
.topbar-left { opacity: 0.72; }
.topbar-right { display: flex; gap: 20px; align-items: center; }
.topbar-right a { color: var(--white); text-decoration: none; opacity: 0.72; transition: opacity .2s; }
.topbar-right a:hover { opacity: 1; }
.topbar-phone { color: var(--orange) !important; opacity: 1 !important; font-weight: 600; }

/* NAV */
.nav {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 0.5px solid var(--line);
  padding: 16px 0;
  position: sticky; top: 0; z-index: 100;
  backdrop-filter: blur(16px);
}
.nav-inner { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.logo { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--black); flex-shrink: 0; }
.logo-mark {
  width: 28px; height: 28px;
  flex-shrink: 0;
  transition: transform .2s;
}
.logo:hover .logo-mark {
  transform: scale(1.08);
}
.logo-text { font-weight: 900; font-size: 18px; letter-spacing: -0.04em; }

/* \uD584\uBC84\uAC70 \uD1A0\uAE00 (\uBAA8\uBC14\uC77C \uC804\uC6A9) */
.nav-toggle {
  display: none;
  appearance: none;
  background: transparent;
  border: none;
  width: 36px;
  height: 36px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 0;
}
.nav-toggle span {
  width: 22px;
  height: 2px;
  background: var(--black);
  border-radius: 2px;
  transition: transform .2s, opacity .2s;
}
.nav-toggle.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav-toggle.open span:nth-child(2) { opacity: 0; }
.nav-toggle.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* \uBA54\uB274 */
.nav-menu { display: flex; gap: 4px; list-style: none; align-items: center; padding: 0; margin: 0; }
.nav-menu > li { position: relative; }
.nav-menu .nav-link {
  appearance: none;
  background: transparent;
  border: none;
  font-family: inherit;
  cursor: pointer;
  color: var(--black);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 9px 14px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  letter-spacing: -0.01em;
  transition: background .15s, color .15s;
}
.nav-menu .nav-link:hover {
  background: var(--orange-tint);
  color: var(--orange);
}
.nav-caret {
  transition: transform .2s;
  opacity: 0.7;
}
.has-mega:hover .nav-caret,
.has-mega.open .nav-caret {
  transform: rotate(180deg);
}
.nav-cta {
  background: var(--orange);
  color: var(--white) !important;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 700 !important;
  font-size: 13.5px !important;
  text-decoration: none;
  letter-spacing: -0.01em;
  margin-left: 8px;
  transition: background .15s, transform .15s;
}
.nav-cta:hover {
  background: var(--orange-deep);
  color: var(--white) !important;
  transform: translateY(-1px);
}

/* === \uBA54\uAC00\uBA54\uB274 === */
.mega-panel {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  background: var(--white);
  border: 0.5px solid var(--line);
  border-radius: 16px;
  padding: 28px 32px;
  min-width: 580px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: opacity .18s ease, transform .18s ease, visibility .18s;
  z-index: 50;
}
.has-mega:hover .mega-panel,
.has-mega.open .mega-panel {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.mega-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 28px;
}
.mega-col-label {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--orange);
  font-weight: 700;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid var(--line);
}
.mega-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 2px;
}
.mega-col:first-child .mega-items {
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;
}
.mega-items a {
  display: block;
  padding: 9px 12px;
  font-size: 13px;
  color: var(--black);
  font-weight: 600;
  text-decoration: none;
  border-radius: 6px;
  letter-spacing: -0.01em;
  transition: background .12s, color .12s;
}
.mega-items a:hover {
  background: var(--orange-tint);
  color: var(--orange);
}

/* HERO */
.hero { padding: 80px 0 100px; background: var(--white); }
.hero-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 60px; align-items: center; }
.hero-chip {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--brown); color: var(--white);
  padding: 7px 14px; border-radius: 100px;
  font-size: 12px; margin-bottom: 32px; font-weight: 500;
}
.hero-chip-dot { width: 6px; height: 6px; background: var(--orange); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.hero h1 {
  font-size: clamp(44px, 5.6vw, 76px);
  font-weight: 900; line-height: 1.02;
  letter-spacing: -0.055em; margin-bottom: 28px;
  color: var(--black);
}
.hero h1 .accent { color: var(--orange); }
.hero-sub {
  font-size: 17px; color: var(--muted);
  line-height: 1.7; max-width: 480px;
  margin-bottom: 40px; font-weight: 300; letter-spacing: -0.01em;
}
.hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 56px; }
.btn {
  padding: 15px 26px; border-radius: var(--radius-sm);
  font-weight: 700; font-size: 14px;
  text-decoration: none; display: inline-flex; align-items: center;
  gap: 8px; transition: all .2s; border: none; cursor: pointer;
  letter-spacing: -0.015em;
}
.btn-primary { background: var(--orange); color: var(--white); }
.btn-primary:hover { background: var(--orange-deep); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255, 105, 0, 0.3); }
.btn-outline { background: var(--white); color: var(--black); border: 1px solid var(--line); }
.btn-outline:hover { background: var(--orange-tint); color: var(--orange); border-color: var(--orange); transform: translateY(-1px); }

.hero-stats { display: flex; gap: 48px; padding-top: 32px; border-top: 0.5px solid var(--line); }
.stat-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 38px; font-weight: 700; line-height: 1;
  letter-spacing: -0.03em; color: var(--black);
}
.stat-num .unit { color: var(--orange); }
.stat-label {
  font-size: 11px; color: var(--muted);
  margin-top: 8px; letter-spacing: 0.08em; font-weight: 500;
}

/* Hero visual */
.hero-visual { position: relative; height: 560px; }
.device { position: absolute; border-radius: var(--radius-md); padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.device-pos { width: 280px; top: 40px; right: 60px; background: var(--white); border: 0.5px solid var(--line); color: var(--black); z-index: 2; transform: rotate(-4deg); }
.device-kiosk { width: 220px; top: 240px; right: 0; background: var(--brown); color: var(--white); z-index: 3; transform: rotate(6deg); }
.device-card { width: 200px; top: 140px; right: 280px; background: var(--orange); color: var(--white); z-index: 1; transform: rotate(-2deg); }
.device-header {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
  margin-bottom: 14px; font-weight: 600; opacity: 0.6;
}
.device-title { font-weight: 800; font-size: 14px; margin-bottom: 4px; letter-spacing: -0.025em; }
.device-amount { font-family: 'Bricolage Grotesque', sans-serif; font-size: 30px; font-weight: 700; letter-spacing: -0.03em; margin: 12px 0 10px; line-height: 1; }
.device-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 11px; border-top: 0.5px dashed rgba(0,0,0,0.1); font-weight: 500; }
.device-kiosk .device-row, .device-card .device-row { border-color: rgba(255,255,255,0.2); }
.device-tag {
  display: inline-block; font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 10px; padding: 3px 8px; background: var(--brown); color: var(--white);
  border-radius: 100px; font-weight: 700; margin-bottom: 10px; letter-spacing: 0.1em;
}
.float-badge {
  position: absolute; background: var(--white); border: 0.5px solid var(--black);
  color: var(--black); padding: 10px 16px; border-radius: 100px;
  font-size: 12px; font-weight: 700; letter-spacing: -0.02em;
  animation: float 3s ease-in-out infinite;
}
.badge-1 { top: 0; left: 20px; }
.badge-2 { bottom: 20px; left: 0; animation-delay: 1.2s; background: var(--orange); color: var(--white); border: none; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

/* SECTION COMMON */
.sec-label {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 12px; font-weight: 600; letter-spacing: 0.2em;
  color: var(--orange); margin-bottom: 14px;
  display: flex; align-items: center; gap: 12px;
}
.sec-label::before { content: ''; width: 24px; height: 1px; background: var(--orange); }
.sec-title {
  font-size: clamp(32px, 4.2vw, 52px);
  font-weight: 900; letter-spacing: -0.045em; line-height: 1.1;
  margin-bottom: 20px; color: var(--black); max-width: 780px;
}
.sec-title .emph { color: var(--orange); }
.sec-sub {
  font-size: 16px; color: var(--muted); line-height: 1.7;
  max-width: 620px; margin-bottom: 56px;
  font-weight: 300; letter-spacing: -0.01em;
}

/* CORE PRODUCTS */
.core-products { padding: 100px 0; background: var(--ivory); border-top: 0.5px solid var(--line); }
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.product-card {
  background: var(--white); border: 0.5px solid var(--line);
  border-radius: var(--radius-md); padding: 36px 30px;
  text-decoration: none; color: inherit;
  transition: all .3s cubic-bezier(.4, 0, .2, 1);
  position: relative; display: flex; flex-direction: column;
  min-height: 340px;
}
.product-card:hover { border-color: var(--black); transform: translateY(-4px); }
.product-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--orange); letter-spacing: 0.22em; font-weight: 700; margin-bottom: 20px; }
.product-icon {
  width: 64px; height: 64px; background: var(--brown);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; margin-bottom: 26px;
}
.product-name { font-size: 22px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 8px; color: var(--black); }
.product-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 400; margin-bottom: auto; min-height: 44px; }
.product-foot { padding-top: 18px; margin-top: 24px; border-top: 0.5px dashed var(--line); display: flex; justify-content: space-between; align-items: center; }
.product-meta { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--muted); font-weight: 600; letter-spacing: -0.01em; }
.product-arrow { color: var(--orange); font-weight: 800; font-size: 18px; transition: transform .2s; }
.product-card:hover .product-arrow { transform: translateX(4px); }
.product-card.reversed { background: var(--brown); color: var(--white); border-color: var(--brown); overflow: hidden; }
.product-card.reversed::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--orange); }
.product-card.reversed .product-icon { background: rgba(255, 105, 0, 0.18); }
.product-card.reversed .product-name { color: var(--white); }
.product-card.reversed .product-desc { color: rgba(255, 255, 255, 0.72); }
.product-card.reversed .product-foot { border-color: rgba(255, 255, 255, 0.2); }
.product-card.reversed .product-meta { color: rgba(255, 255, 255, 0.65); }
.product-card.reversed:hover { background: var(--brown-deep); border-color: var(--brown-deep); }

/* ================================================
   EQUIPMENT GALLERY (9\uAC1C \uD575\uC2EC \uC7A5\uBE44 - \uCEF4\uD329\uD2B8, \uD14C\uB450\uB9AC \uC5C6\uC74C)
   ================================================ */
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 900px;
  margin: 0 auto;
}
.equipment-card {
  background: var(--ivory);
  border: none;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: var(--black);
  transition: all .25s ease;
  display: flex;
  flex-direction: column;
}
.equipment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(255, 105, 0, 0.12);
}

/* \uC0C1\uB2E8 \uC774\uB984 (\uC791\uAC8C) */
.equipment-name-top {
  padding: 14px 14px 8px;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--black);
  transition: color .3s;
}
.equipment-card:hover .equipment-name-top {
  color: var(--orange);
}

/* \uC774\uBBF8\uC9C0 \uC601\uC5ED (\uC544\uC774\uBCF4\uB9AC \uD1B5\uC77C) */
.equipment-thumb {
  background: var(--ivory);
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.equipment-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4%;
  transition: opacity .5s ease, transform .5s ease;
}
.equipment-card:hover .equipment-thumb img {
  opacity: 0;
  transform: scale(0.92);
}

/* \uD638\uBC84 \uC2DC \uC0AC\uC6A9\uCC98 \uC124\uBA85 \uC624\uBC84\uB808\uC774 */
.equipment-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  transition: opacity .5s ease;
}
.equipment-card:hover .equipment-overlay {
  opacity: 1;
}
.equipment-overlay-text {
  color: var(--white);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.55;
  text-align: center;
  transform: translateY(10px);
  transition: transform .5s ease .15s;
}
.equipment-card:hover .equipment-overlay-text {
  transform: translateY(0);
}

/* \uBAA8\uBC14\uC77C \uD0ED \uD65C\uC131\uD654 */
.equipment-card.active .equipment-thumb img {
  opacity: 0;
  transform: scale(0.92);
}
.equipment-card.active .equipment-overlay {
  opacity: 1;
}
.equipment-card.active .equipment-overlay-text {
  transform: translateY(0);
}
.equipment-card.active .equipment-name-top {
  color: var(--orange);
}

@media (max-width: 960px) {
  .equipment-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .equipment-name-top { font-size: 13px; padding: 12px 10px 6px; }
  .equipment-overlay-text { font-size: 12px; line-height: 1.5; }
  .equipment-overlay { padding: 14px; }
}
@media (max-width: 480px) {
  .equipment-grid { grid-template-columns: repeat(2, 1fr); }
  .equipment-overlay-text { font-size: 11px; }
}

/* INDUSTRIES */
.industries { padding: 100px 0; background: var(--ivory); }
.industries .container { text-align: left; }
.industries .sec-title { max-width: 780px; }
.industries .sec-sub { max-width: 620px; margin-bottom: 48px; }

/* K \uB514\uC790\uC778 - \uC88C\uC6B0 \uBD84\uD560 */
.ind-split {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 0;
  background: var(--white);
  border: 0.5px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  min-height: 360px;
}

/* \uC88C\uCE21 \uCE74\uD14C\uACE0\uB9AC \uBA54\uB274 */
.ind-cat-menu {
  border-right: 0.5px solid var(--line);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--white);
}
.ind-cat-btn {
  appearance: none;
  background: transparent;
  border: none;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  transition: background .15s ease, color .15s ease;
  font-family: inherit;
}
.ind-cat-btn:hover {
  background: var(--ivory);
  color: var(--black);
}
.ind-cat-btn.active {
  background: var(--brown);
  color: var(--white);
}
.ind-cat-name {
  font-size: 14px;
  letter-spacing: -0.01em;
}
.ind-cat-count {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  color: #BBB;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.ind-cat-btn.active .ind-cat-count {
  color: var(--orange);
}

/* \uC6B0\uCE21 \uD328\uB110 */
.ind-cat-panels {
  padding: 32px 36px;
  position: relative;
  min-height: 320px;
}
.ind-cat-panel {
  display: none;
}
.ind-cat-panel.active {
  display: block;
  animation: ind-fade-in .25s ease;
}
@keyframes ind-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ind-cat-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--black);
  letter-spacing: -0.03em;
  margin: 0 0 6px;
  line-height: 1.2;
}
.ind-cat-sub {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 26px;
  line-height: 1.55;
  font-weight: 400;
}
.ind-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.ind-item {
  background: var(--ivory);
  border: 0.5px solid transparent;
  border-radius: 10px;
  padding: 16px 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--black);
  text-align: center;
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease;
  letter-spacing: -0.01em;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  line-height: 1.25;
}
.ind-item:hover {
  background: var(--white);
  border-color: var(--orange);
  color: var(--orange);
  transform: translateY(-1px);
}

/* \uBAA8\uBC14\uC77C \uBC18\uC751\uD615 */
@media (max-width: 720px) {
  .ind-split {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .ind-cat-menu {
    border-right: none;
    border-bottom: 0.5px solid var(--line);
    flex-direction: row;
    flex-wrap: wrap;
    padding: 12px;
    gap: 6px;
    overflow-x: auto;
  }
  .ind-cat-btn {
    flex: 0 0 auto;
    padding: 10px 14px;
    font-size: 12.5px;
  }
  .ind-cat-name { font-size: 12.5px; }
  .ind-cat-count { font-size: 10px; }
  .ind-cat-panels {
    padding: 24px 20px 28px;
  }
  .ind-cat-title { font-size: 20px; }
  .ind-cat-sub { font-size: 12px; margin-bottom: 18px; }
  .ind-items {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  .ind-item {
    padding: 14px 10px;
    font-size: 12.5px;
    min-height: 48px;
  }
}

/* REGIONS */
.regions { padding: 100px 0; background: var(--white); }
.region-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.region-card {
  background: var(--white); border: 0.5px solid var(--line);
  border-radius: var(--radius-md); padding: 40px 32px;
  text-decoration: none; color: var(--black); transition: all .3s;
}
.region-card:hover { border-color: var(--black); transform: translateY(-4px); }
.region-en { font-family: 'Bricolage Grotesque', sans-serif; font-size: 52px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-bottom: 6px; color: var(--black); }
.region-ko { font-size: 18px; font-weight: 800; color: var(--muted); letter-spacing: -0.03em; margin-bottom: 28px; }
.region-stats { display: flex; gap: 24px; padding-top: 20px; border-top: 0.5px dashed var(--line); }
.region-stat-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; }
.region-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.05em; margin-top: 4px; font-weight: 500; }
.region-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 22px; }
.region-chip { font-size: 12px; padding: 4px 10px; background: var(--orange-tint); color: var(--brown); border-radius: 100px; font-weight: 500; }
.region-note {
  background: var(--brown); color: var(--white);
  border-radius: var(--radius-md); padding: 28px 32px;
  margin-top: 20px; display: flex; gap: 20px; align-items: center;
  font-size: 14px; line-height: 1.6; font-weight: 300;
}
.region-note strong { color: var(--orange); font-weight: 700; letter-spacing: -0.015em; }

/* REGION CATEGORY TABS */
.region-category-tabs {
  display: flex; gap: 8px; margin-bottom: 32px;
  justify-content: center; flex-wrap: wrap;
}
.category-tab {
  background: var(--white); border: 0.5px solid var(--line);
  border-radius: 24px; padding: 10px 18px;
  font-size: 13px; font-weight: 600; letter-spacing: -0.02em;
  color: var(--muted); cursor: pointer; transition: all .25s;
  display: flex; align-items: center; gap: 6px;
}
.category-tab:hover { border-color: var(--orange); color: var(--black); }
.category-tab.active {
  background: var(--orange); border-color: var(--orange); 
  color: var(--white); transform: translateY(-1px);
}
.tab-count {
  background: rgba(0,0,0,0.15); color: rgba(255,255,255,0.9);
  border-radius: 12px; padding: 2px 6px; font-size: 10px; 
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700;
}
.category-tab.active .tab-count {
  background: rgba(255,255,255,0.25); color: var(--white);
}
.category-tab:not(.active) .tab-count {
  background: var(--orange-tint); color: var(--brown);
}

/* REGION CATEGORY BADGE */
.region-category-badge {
  position: absolute; top: 16px; right: 16px;
  background: var(--orange); color: var(--white);
  font-size: 10px; padding: 4px 8px; border-radius: 12px;
  font-weight: 600; letter-spacing: 0.03em;
}
.region-card { position: relative; }

/* REGION CHARACTERISTICS */
.region-characteristics {
  margin: 20px 0; padding: 16px 0;
  border-top: 0.5px dashed var(--line);
  border-bottom: 0.5px dashed var(--line);
}
.region-summary {
  font-size: 13px; line-height: 1.5; color: var(--black);
  margin-bottom: 12px; font-weight: 300;
}
.region-business-hours {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; color: var(--muted); font-weight: 500;
  background: var(--orange-tint); padding: 6px 10px;
  border-radius: 8px;
}
.hours-icon { font-size: 14px; }

/* REGION INDUSTRIES */
.region-industries {
  margin-top: 16px; padding-top: 16px;
  border-top: 0.5px dashed var(--line);
}
.region-industries-label {
  font-size: 10px; color: var(--muted); font-weight: 600;
  letter-spacing: 0.05em; margin-bottom: 8px;
}
.region-industries-list {
  font-size: 12px; color: var(--brown); font-weight: 500;
  letter-spacing: -0.01em; line-height: 1.4;
}
.region-industry-tag {
  display: inline;
}

/* ================================================
   SOLUTION TABS (\uC0C8 3\uD0ED \uAD6C\uC870: \uC9C0\uC5ED/\uC81C\uD488/\uC0C1\uB2F4)
   ================================================ */
.solution-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 32px 0 40px;
  flex-wrap: wrap;
}
.solution-tab {
  background: var(--white);
  border: 0.5px solid var(--line);
  border-radius: 100px;
  padding: 14px 26px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--black);
  cursor: pointer;
  transition: all .25s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
}
.solution-tab:hover {
  background: var(--orange-tint);
  border-color: var(--orange);
  color: var(--orange);
}
.solution-tab.active {
  background: var(--orange);
  border-color: var(--orange);
  color: var(--white);
  box-shadow: 0 4px 16px rgba(255, 105, 0, 0.28);
}
.solution-tab .tab-en {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  opacity: 0.7;
}
.solution-tab .tab-divider {
  opacity: 0.4;
  margin: 0 2px;
}

.solution-panel {
  display: none;
  animation: fadeInPanel .3s ease;
}
.solution-panel.active {
  display: block;
}
@keyframes fadeInPanel {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Pill \uADF8\uB9AC\uB4DC */
.solution-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: 720px;
  margin: 0 auto;
}
.solution-grid.product-grid {
  max-width: 520px;
}
.solution-pill {
  padding: 11px 22px;
  text-align: center;
  border: 1px solid var(--line);
  border-radius: 100px;
  background: var(--white);
  transition: all .25s ease;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--black);
  min-width: 92px;
}
.solution-grid.product-grid .solution-pill {
  min-width: 140px;
}
.solution-pill:hover {
  border-color: var(--orange);
  background: var(--orange);
  color: var(--white);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(255, 105, 0, 0.28);
}

/* \uACAC\uC801 \uC0C1\uB2F4 \uBC15\uC2A4 */
.consult-box {
  background: var(--white);
  border: 0.5px solid var(--line);
  border-radius: 16px;
  padding: 48px 32px;
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
}
.consult-phone {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: var(--orange);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.consult-msg {
  font-size: 15px;
  color: var(--muted);
  font-weight: 400;
  margin-bottom: 28px;
}
.consult-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}
.consult-btn {
  padding: 14px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
  border: none;
  transition: all .25s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  text-decoration: none;
}
.consult-btn-primary {
  background: var(--orange);
  color: var(--white);
}
.consult-btn-primary:hover {
  background: var(--brown);
  transform: translateY(-1px);
}
.consult-btn-sms {
  background: #00C73C;
  color: var(--white);
}
.consult-btn-sms:hover {
  background: #00A82F;
  transform: translateY(-1px);
}
.consult-btn-secondary {
  background: var(--ivory);
  color: var(--black);
  border: 0.5px solid var(--line);
}
.consult-btn-secondary:hover {
  border-color: var(--black);
}
.consult-info {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
  padding-top: 20px;
  border-top: 0.5px dashed var(--line);
}

@media (max-width: 720px) {
  .solution-tabs { gap: 6px; }
  .solution-tab { padding: 12px 18px; font-size: 13px; }
  .solution-tab .tab-en { font-size: 10px; }
  .solution-grid { gap: 6px; max-width: 380px; }
  .solution-pill { padding: 10px 16px; font-size: 12px; min-width: 72px; }
  .solution-grid.product-grid .solution-pill { min-width: 110px; }
  .consult-phone { font-size: 28px; }
}

/* PROCESS */
.process { padding: 100px 0; background: var(--brown); color: var(--white); }
.process .sec-label { color: var(--orange); }
.process .sec-label::before { background: var(--orange); }
.process .sec-title { color: var(--white); }
.process .sec-sub { color: rgba(255, 255, 255, 0.65); }
.process-steps {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-top: 0.5px solid rgba(255, 255, 255, 0.15);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.15);
  margin-top: 40px;
}
.process-step { padding: 40px 28px; border-right: 0.5px solid rgba(255, 255, 255, 0.15); }
.process-step:last-child { border-right: none; }
.step-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--orange); margin-bottom: 32px; letter-spacing: 0.2em; font-weight: 700; }
.step-title { font-size: 22px; font-weight: 900; margin-bottom: 10px; letter-spacing: -0.035em; }
.step-desc { font-size: 13px; color: rgba(255, 255, 255, 0.65); line-height: 1.6; margin-bottom: 20px; font-weight: 300; }
.step-time { display: inline-block; padding: 4px 12px; background: rgba(255, 105, 0, 0.2); color: var(--orange); border-radius: 100px; font-size: 11px; font-weight: 700; font-family: 'Bricolage Grotesque', sans-serif; }

/* TESTIMONIALS */
.testimonials { padding: 100px 0; background: var(--white); }
.testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.testi-card { background: var(--white); border: 0.5px solid var(--line); border-radius: var(--radius-md); padding: 32px 28px; transition: all .25s; }
.testi-card:hover { border-color: var(--black); transform: translateY(-3px); }
.testi-card.reversed { background: var(--brown); color: var(--white); border-color: var(--brown); transform: translateY(-12px); }
.testi-card.reversed:hover { background: var(--brown-deep); border-color: var(--brown-deep); transform: translateY(-16px); }
.testi-tag { display: inline-block; font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; font-weight: 700; color: var(--orange); padding: 4px 10px; background: var(--orange-tint); border-radius: var(--radius-sm); margin-bottom: 22px; }
.testi-card.reversed .testi-tag { background: rgba(255, 105, 0, 0.18); }
.testi-stars { color: var(--orange); margin-bottom: 16px; letter-spacing: 2px; font-size: 13px; }
.testi-text { font-size: 18px; font-weight: 900; line-height: 1.35; margin-bottom: 14px; letter-spacing: -0.035em; white-space: pre-line; }
.testi-body { font-size: 14px; color: var(--muted); line-height: 1.65; margin-bottom: 24px; font-weight: 300; }
.testi-card.reversed .testi-body { color: rgba(255, 255, 255, 0.7); }
.testi-author { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 0.5px dashed var(--line); font-size: 12px; }
.testi-card.reversed .testi-author { border-color: rgba(255, 255, 255, 0.2); }
.testi-author-name { font-weight: 700; letter-spacing: -0.02em; }
.testi-author-region { font-family: 'Bricolage Grotesque', sans-serif; color: var(--muted); font-weight: 600; letter-spacing: 0.05em; }
.testi-card.reversed .testi-author-region { color: rgba(255, 255, 255, 0.5); }

/* CTA */
.cta-section { background: var(--orange); color: var(--white); padding: 80px 0; position: relative; overflow: hidden; }
.cta-section::before { content: ''; position: absolute; top: -120px; right: -120px; width: 420px; height: 420px; background: var(--orange-deep); border-radius: 50%; opacity: 0.35; }
.cta-inner { display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: center; position: relative; z-index: 2; }
.cta-inner h2 { font-size: clamp(32px, 4vw, 52px); font-weight: 900; line-height: 1.1; letter-spacing: -0.045em; margin-bottom: 18px; }
.cta-inner p { font-size: 16px; opacity: 0.92; line-height: 1.65; max-width: 520px; }
.cta-phone { background: var(--white); color: var(--black); border-radius: var(--radius-md); padding: 36px 32px; text-decoration: none; display: block; transition: transform .25s; }
.cta-phone:hover { transform: translateY(-4px); }
.cta-phone-label { font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--muted); margin-bottom: 10px; letter-spacing: 0.18em; font-weight: 600; }
.cta-phone-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 42px; font-weight: 700; line-height: 1; letter-spacing: -0.035em; margin-bottom: 18px; color: var(--black); }
.cta-phone-hours { font-size: 12px; color: var(--muted); border-top: 0.5px dashed var(--line); padding-top: 16px; line-height: 1.5; font-weight: 500; }

/* FOOTER */
footer { background: var(--brown); color: var(--white); padding: 72px 0 28px; }

/* \uC0C8 Footer: \uC88C\uCE21 brand + \uC6B0\uCE21 \uBA54\uB274 \uCEEC\uB7FC\uB4E4 */
.footer-main {
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: 60px;
  margin-bottom: 56px;
  align-items: start;
}
.footer-brand .logo-text {
  color: var(--white);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.04em;
}
.footer-tagline {
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  line-height: 1.7;
  margin-top: 14px;
  margin-bottom: 24px;
  font-weight: 300;
  letter-spacing: -0.01em;
}
.footer-brand .footer-contact {
  text-align: left;
  margin-top: 0;
}
.footer-phone {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--orange);
  text-decoration: none;
  letter-spacing: -0.03em;
  transition: opacity .2s;
  display: inline-block;
}
.footer-phone:hover { opacity: 0.8; }
.footer-hours {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 6px;
  letter-spacing: -0.01em;
}

/* \uC6B0\uCE21 \uBA54\uB274 \uCEEC\uB7FC\uB4E4 */
.footer-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
.footer-col-label {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--orange);
  font-weight: 700;
  margin-bottom: 16px;
  text-transform: uppercase;
}
.footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-col li + li { margin-top: 8px; }
.footer-col a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: color .15s;
  display: inline-block;
  padding: 2px 0;
}
.footer-col a:hover { color: var(--white); }

.footer-bottom {
  border-top: 0.5px solid rgba(255, 255, 255, 0.15);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  font-family: 'Bricolage Grotesque', sans-serif;
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .footer-cols {
    grid-template-columns: 1fr 1fr;
    gap: 28px 20px;
  }
  .footer-phone { font-size: 24px; }
  .footer-bottom {
    flex-direction: column;
    gap: 8px;
  }
}

/* FLOATING PHONE */
.floating-phone {
  position: fixed; bottom: 24px; right: 24px;
  background: var(--orange); color: var(--white);
  padding: 16px 24px; border-radius: 100px;
  font-weight: 800; font-size: 14px;
  text-decoration: none; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 12px 32px rgba(255, 105, 0, 0.38);
  z-index: 99; transition: transform .2s; letter-spacing: -0.02em;
}
.floating-phone:hover { transform: scale(1.04); }

/* BREADCRUMB (for interior pages) */
.breadcrumb { padding: 28px 0 16px; background: var(--white); font-size: 12px; color: var(--muted); }
.breadcrumb ol { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.breadcrumb a { color: var(--muted); text-decoration: none; }
.breadcrumb a:hover { color: var(--orange); }
.breadcrumb li + li::before { content: '/'; margin-right: 6px; color: var(--muted-light); }
.breadcrumb li:last-child { color: var(--black); font-weight: 600; }

/* PAGE HEADER (interior) */
.page-header { padding: 60px 0 80px; background: var(--white); border-bottom: 0.5px solid var(--line); }

/* RESPONSIVE */
@media (max-width: 968px) {
  .container { padding: 0 20px; }
  .hero { padding: 60px 0 80px; }
  .hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .hero-visual { height: 420px; }
  .hero-stats { gap: 28px; flex-wrap: wrap; }
  .product-grid { grid-template-columns: 1fr; }
  .region-grid { grid-template-columns: 1fr; }
  .process-steps { grid-template-columns: 1fr 1fr; }
  .process-step { border-right: none; border-bottom: 0.5px solid rgba(255, 255, 255, 0.15); }
  .process-step:nth-child(2n-1) { border-right: 0.5px solid rgba(255, 255, 255, 0.15); }
  .testi-grid { grid-template-columns: 1fr; }
  .testi-card.reversed { transform: none; }
  .cta-inner { grid-template-columns: 1fr; gap: 36px; }

  /* \uBAA8\uBC14\uC77C \uB124\uBE44\uAC8C\uC774\uC158 - \uD584\uBC84\uAC70 \uD1A0\uAE00 */
  .nav-toggle { display: flex; }
  .nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--white);
    border-top: 0.5px solid var(--line);
    border-bottom: 0.5px solid var(--line);
    flex-direction: column;
    align-items: stretch;
    padding: 8px 16px 14px;
    gap: 0;
    box-shadow: 0 12px 24px rgba(0,0,0,0.04);
  }
  .nav-menu.open { display: flex; }
  .nav-menu > li { width: 100%; }
  .nav-menu .nav-link {
    width: 100%;
    padding: 14px 14px;
    justify-content: space-between;
    border-radius: 8px;
  }
  .nav-cta {
    margin-left: 0;
    margin-top: 8px;
    text-align: center;
    padding: 14px 20px;
    width: 100%;
    box-sizing: border-box;
  }
  /* \uBAA8\uBC14\uC77C \uBA54\uAC00\uBA54\uB274: \uC778\uB77C\uC778 \uD3BC\uCE68 */
  .mega-panel {
    position: static;
    min-width: 0;
    width: 100%;
    box-shadow: none;
    border: none;
    border-radius: 0;
    padding: 8px 8px 16px;
    margin-top: 0;
    background: var(--ivory);
    border-radius: 8px;
  }
  .mega-inner {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .mega-col:first-child .mega-items {
    grid-template-columns: 1fr 1fr;
  }
}

/* ================================================
   BUSINESS CONFIG (\uC9C0\uC5ED \uD398\uC774\uC9C0 - \uB9DE\uCDA4 \uAD6C\uC131 6\uAC00\uC9C0, 2\uC904 \uBBF8\uB2C8\uBA40)
   ================================================ */
.business-configs {
  padding: 72px 0;
  background: var(--white);
  border-top: 0.5px solid var(--line);
}
.config-list {
  max-width: 880px;
}
.config-row {
  display: block;
  padding: 18px 22px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--white);
  transition: all .12s ease-out;
  text-decoration: none;
  color: inherit;
  margin-bottom: 8px;
  position: relative;
}
.config-row:hover {
  border-color: var(--orange);
  background: var(--orange-tint);
  transform: translateX(4px);
}
.config-row:hover .config-num,
.config-row:hover .config-name {
  color: var(--orange-deep);
}
.config-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}
.config-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.12em;
  transition: color .12s;
  flex-shrink: 0;
}
.config-name {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--black);
  line-height: 1.3;
  transition: color .12s;
}
.config-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.55;
  padding-left: 36px;
}
.popular-badge {
  position: absolute;
  top: -8px;
  right: 16px;
  background: var(--orange);
  color: var(--white);
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 3px 8px;
  border-radius: 100px;
  box-shadow: 0 4px 12px rgba(255, 105, 0, 0.4);
}

/* ================================================
   INSTALL STEPS (\uC9C0\uC5ED \uD398\uC774\uC9C0 - \uC124\uCE58 4\uB2E8\uACC4, \uCD95\uC18C)
   ================================================ */
.install-process {
  padding: 64px 0;
  background: var(--brown);
  color: var(--white);
  position: relative;
  overflow: hidden;
}
.install-process::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 240px; height: 240px;
  background: radial-gradient(circle, var(--orange) 0%, transparent 60%);
  opacity: 0.18;
}
.install-process .sec-label { color: var(--orange); }
.install-process .sec-label::before { background: var(--orange); }
.install-process .sec-title { color: var(--white); font-size: clamp(22px, 2.4vw, 30px); margin-bottom: 10px; }
.install-process .sec-sub { color: rgba(255,255,255,0.65); margin-bottom: 32px; font-size: 13px; }
.install-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.install-step {
  padding: 20px 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  transition: all .12s;
}
.install-step:hover {
  background: rgba(255, 105, 0, 0.08);
  border-color: var(--orange);
  transform: translateY(-2px);
}
.install-step .step-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.install-step .step-badge {
  width: 38px; height: 38px;
  background: var(--orange);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: -0.02em;
  box-shadow: 0 4px 12px rgba(255, 105, 0, 0.4);
  flex-shrink: 0;
}
.install-step .step-label {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--orange);
  font-weight: 700;
}
.install-step .step-name {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--white);
  margin-bottom: 6px;
}
.install-step .step-desc {
  font-size: 12px;
  line-height: 1.55;
  color: rgba(255,255,255,0.58);
  margin-bottom: 8px;
}
.install-step .step-time {
  display: inline-block;
  padding: 3px 9px;
  background: rgba(255, 105, 0, 0.15);
  color: var(--orange);
  border-radius: 100px;
  font-size: 10px;
  font-weight: 700;
  font-family: 'Bricolage Grotesque', sans-serif;
  letter-spacing: 0.05em;
}

@media (max-width: 720px) {
  .install-steps { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 540px) {
  .config-row { padding: 16px 18px; }
  .config-name { font-size: 15px; }
  .config-desc { font-size: 12px; padding-left: 30px; }
  .config-num { font-size: 12px; }
  .popular-badge { right: 12px; font-size: 8px; padding: 2px 7px; }
}
@media (max-width: 420px) {
  .install-steps { grid-template-columns: 1fr; }
}

/* ================================================
   INDUSTRY PAGE - \uC2DC\uC7A5 \uD604\uD669 + \uC124\uCE58 \uC2E4\uC801 \uBC18\uC751\uD615
   ================================================ */
.industry-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 40px;
}
.industry-record-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 40px;
}
@media (max-width: 720px) {
  .industry-stats-grid { grid-template-columns: 1fr; gap: 12px; }
  .industry-record-grid { grid-template-columns: 1fr; gap: 10px; }
}

/* ================================================
   INDUSTRY PAGE - \uC131\uACF5 \uD301 3\uAC00\uC9C0
   ================================================ */
.success-tips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 40px;
}
.success-tip-card {
  background: var(--ivory);
  border-radius: 20px;
  padding: 40px 32px;
  transition: all .2s ease;
  position: relative;
  overflow: hidden;
}
.success-tip-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--orange);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .3s ease;
}
.success-tip-card:hover {
  background: var(--orange-tint);
  transform: translateY(-4px);
}
.success-tip-card:hover::before {
  transform: scaleX(1);
}
.success-tip-card:hover .success-tip-num {
  color: var(--orange);
}
.success-tip-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.18em;
  margin-bottom: 20px;
  transition: color .2s;
}
.success-tip-title {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--black);
  line-height: 1.3;
  margin-bottom: 14px;
}
.success-tip-desc {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.7;
  font-weight: 400;
}

@media (max-width: 960px) {
  .success-tips-grid { grid-template-columns: 1fr; gap: 12px; }
  .success-tip-card { padding: 32px 26px; }
  .success-tip-title { font-size: 17px; }
}

/* ================================================
   INDUSTRY PAGE - \uB9DE\uCDA4 \uD328\uD0A4\uC9C0 3\uAC00\uC9C0
   ================================================ */
.industry-packages-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 40px;
}
.package-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 36px 28px;
  position: relative;
  transition: all .2s;
}
.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 32px rgba(0,0,0,0.06);
}
.package-card.popular {
  border: 2px solid var(--orange);
  transform: scale(1.02);
}
.package-card.popular:hover {
  transform: scale(1.02) translateY(-4px);
}
.package-badge {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--orange);
  color: var(--white);
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  padding: 5px 14px;
  border-radius: 100px;
}
.package-tier {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--orange);
  margin-bottom: 10px;
}
.package-name {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--black);
  margin-bottom: 6px;
}
.package-target {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}
.package-items {
  list-style: none;
  padding: 0;
  margin: 0 0 28px 0;
  min-height: 110px;
}
.package-items li {
  font-size: 14px;
  color: var(--black);
  padding: 6px 0 6px 22px;
  position: relative;
  line-height: 1.55;
}
.package-items li::before {
  content: '\u2713';
  position: absolute;
  left: 0;
  color: var(--orange);
  font-weight: 700;
}
.package-cost {
  background: var(--ivory);
  border-radius: 12px;
  padding: 16px 18px;
}
.package-cost-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 0;
}
.package-cost-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}
.package-cost-value {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--black);
  letter-spacing: -0.02em;
}
.package-cost-value.emph {
  color: var(--orange);
  font-size: 18px;
}

@media (max-width: 960px) {
  .industry-packages-grid { grid-template-columns: 1fr; gap: 14px; }
  .package-card.popular { transform: none; }
  .package-card.popular:hover { transform: translateY(-4px); }
  .package-items { min-height: auto; }
}

/* ================================================
   INDUSTRY PAGE - \uC774\uAC83\uB9CC\uC740 \uD53C\uD558\uC138\uC694
   ================================================ */
.warnings-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 40px;
  max-width: 820px;
}
.warning-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-left: 4px solid #DD4400;
  border-radius: 12px;
  padding: 22px 26px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  transition: all .2s;
}
.warning-card:hover {
  background: #FFF7F0;
  border-color: var(--orange);
  border-left-color: var(--orange);
}
.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}
.warning-content { flex: 1; }
.warning-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--black);
  margin-bottom: 6px;
}
.warning-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.65;
}

@media (max-width: 720px) {
  .warning-card { padding: 18px 20px; gap: 14px; }
  .warning-title { font-size: 15px; }
  .warning-desc { font-size: 12.5px; }
}

/* ================================================
   INDUSTRY PAGE - FAQ
   ================================================ */
.faq-list {
  max-width: 820px;
  margin-top: 40px;
}
.faq-item {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: all .2s;
}
.faq-item:hover {
  border-color: var(--orange);
}
.faq-item[open] {
  border-color: var(--orange);
  background: var(--orange-tint);
}
.faq-q {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.faq-q::-webkit-details-marker { display: none; }
.faq-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--orange);
  letter-spacing: 0.1em;
  flex-shrink: 0;
}
.faq-q-text {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: var(--black);
  letter-spacing: -0.02em;
  line-height: 1.5;
}
.faq-icon {
  font-size: 22px;
  font-weight: 300;
  color: var(--orange);
  transition: transform .3s;
  flex-shrink: 0;
  line-height: 1;
}
.faq-item[open] .faq-icon {
  transform: rotate(45deg);
}
.faq-a {
  padding: 0 24px 22px 60px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.75;
  font-weight: 400;
}

@media (max-width: 720px) {
  .faq-q { padding: 16px 18px; gap: 10px; }
  .faq-q-text { font-size: 14px; }
  .faq-a { padding: 0 18px 18px 42px; font-size: 13px; }
}

/* ================================================
   INSTALL GALLERY - \uC124\uCE58 \uD6C4\uAE30 \uC0AC\uC9C4 \uBB34\uD55C \uC2AC\uB77C\uC774\uB4DC
   ================================================ */
.install-gallery {
  padding: 72px 0 80px;
  background: var(--ivory);
  overflow: hidden;
}
.install-gallery .container { text-align: center; margin-bottom: 36px; }
.install-gallery .sec-label {
  display: inline-flex;
  justify-content: center;
}
.install-gallery .sec-label::after {
  content: '';
  width: 24px;
  height: 1px;
  background: var(--orange);
}
.install-gallery .sec-title {
  font-size: clamp(24px, 2.6vw, 32px);
  margin: 0 auto 10px;
  max-width: none;
}
.install-gallery .sec-sub {
  color: var(--muted);
  font-size: 13px;
  margin: 0 auto;
  max-width: none;
}

.install-slider {
  position: relative;
  width: 100%;
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent 0, #000 60px, #000 calc(100% - 60px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 60px, #000 calc(100% - 60px), transparent 100%);
  padding: 8px 0 12px;
}
.install-track {
  display: flex;
  width: max-content;
  gap: 18px;
  animation: install-scroll 90s linear infinite;
  will-change: transform;
}
.install-slider:hover .install-track {
  animation-play-state: paused;
}
.install-slide {
  flex: 0 0 300px;
  height: 250px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.install-slide:hover {
  transform: translateY(-3px);
  border-color: var(--orange);
  box-shadow: 0 10px 28px rgba(255, 105, 0, 0.14);
}
.install-slide img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  background: #f2f0ea;
}
.install-caption {
  padding: 12px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brown);
  letter-spacing: -0.01em;
  text-align: left;
  line-height: 1.35;
  flex: 1;
  display: flex;
  align-items: center;
}

/* \uBB34\uD55C \uB8E8\uD504: \uD2B8\uB799\uC5D0 17\uAC1C \xD7 2 = 34\uAC1C\uAC00 \uB4E4\uC5B4\uC788\uACE0, \uC808\uBC18(17\uAC1C + gap 17\uAC1C)\uB9CC\uD07C \uC67C\uCABD\uC73C\uB85C \uC774\uB3D9 */
@keyframes install-scroll {
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(calc((-300px - 18px) * 17), 0, 0); }
}

@media (max-width: 720px) {
  .install-gallery { padding: 56px 0 64px; }
  .install-slide { flex-basis: 240px; height: 210px; }
  .install-slide img { height: 160px; }
  .install-caption { padding: 10px 12px; font-size: 11.5px; }
  @keyframes install-scroll {
    0%   { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(calc((-240px - 18px) * 17), 0, 0); }
  }
}
@media (max-width: 420px) {
  .install-slide { flex-basis: 210px; height: 190px; }
  .install-slide img { height: 140px; }
}

/* ================================================
   INSTALL REVIEWS - \uD55C \uC904 \uD6C4\uAE30 \uC138\uB85C \uC790\uB3D9 \uC2AC\uB77C\uC774\uB4DC
   ================================================ */
.install-reviews {
  padding: 64px 0 80px;
  background: var(--ivory);
  border-top: 0.5px solid var(--line);
  overflow: hidden;
}
.install-reviews .container { text-align: center; margin-bottom: 32px; }
.install-reviews .sec-label {
  display: inline-flex;
  justify-content: center;
}
.install-reviews .sec-label::after {
  content: '';
  width: 24px;
  height: 1px;
  background: var(--orange);
}
.install-reviews .sec-title {
  font-size: clamp(24px, 2.6vw, 32px);
  margin: 0 auto 10px;
  max-width: none;
}
.install-reviews .sec-sub {
  color: var(--muted);
  font-size: 13px;
  margin: 0 auto;
  max-width: none;
}

.reviews-stage {
  max-width: 720px;
  margin: 0 auto;
  height: 320px;
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(to bottom, transparent 0, #000 60px, #000 calc(100% - 60px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 60px, #000 calc(100% - 60px), transparent 100%);
  padding: 0 20px;
}
.reviews-track {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: reviews-scroll 35s linear infinite;
  will-change: transform;
}
.reviews-stage:hover .reviews-track {
  animation-play-state: paused;
}

.review-row {
  background: #fff;
  border: 0.5px solid var(--line);
  border-radius: 12px;
  padding: 16px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  transition: border-color .18s ease, transform .18s ease;
}
.review-row:hover {
  border-color: var(--orange);
  transform: translateX(2px);
}
.review-quote {
  font-size: 14px;
  font-weight: 700;
  color: var(--black);
  letter-spacing: -0.02em;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}
.review-quote::before { content: '"'; color: var(--orange); margin-right: 4px; font-weight: 800; }
.review-quote::after { content: '"'; color: var(--orange); margin-left: 2px; font-weight: 800; }
.review-meta {
  font-size: 10.5px;
  color: var(--orange);
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 5px 10px;
  background: var(--orange-tint);
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 1\uC138\uD2B8(10\uAC1C) \uB9CC\uD07C \uC704\uB85C \uC774\uB3D9 = (16px*2 padding + 14px line + border) \u2248 60px + 12px gap */
@keyframes reviews-scroll {
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(0, calc((-60px - 12px) * 10), 0); }
}

@media (max-width: 720px) {
  .install-reviews { padding: 56px 0 64px; }
  .reviews-stage { height: 280px; }
  .review-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 14px 18px;
  }
  .review-quote { font-size: 13px; }
  .review-meta { font-size: 10px; padding: 4px 8px; }
  /* \uBAA8\uBC14\uC77C\uC5D0\uC11C\uB294 \uCE74\uB4DC \uB192\uC774\uAC00 \uB2E4\uB984 (\uC138\uB85C \uBC30\uCE58) \u2248 80px + 12px gap */
  @keyframes reviews-scroll {
    0%   { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(0, calc((-92px) * 10), 0); }
  }
}

/* ================================================
   WHY US - \uCC28\uBCC4\uC810 4\uAC00\uC9C0
   ================================================ */
.why-us {
  padding: 100px 0;
  background: var(--white);
  border-top: 0.5px solid var(--line);
}
.why-us .why-head {
  text-align: left;
  margin-bottom: 48px;
}
.why-us .sec-title { max-width: 780px; }
.why-us .sec-sub { max-width: 620px; }

.why-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.why-card {
  background: var(--ivory);
  border: 0.5px solid transparent;
  border-radius: 16px;
  padding: 32px 30px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: background .2s ease, border-color .2s ease, transform .2s ease;
}
.why-card:hover {
  background: var(--white);
  border-color: var(--orange);
  transform: translateY(-2px);
}
.why-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--orange);
  letter-spacing: 0.2em;
}
.why-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--black);
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1.25;
}
.why-desc {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.65;
  margin: 0;
  font-weight: 400;
  flex: 1;
}
.why-metric {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-top: 14px;
  border-top: 0.5px solid var(--line);
  margin-top: 4px;
}
.why-metric-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: var(--black);
  letter-spacing: -0.04em;
  line-height: 1;
}
.why-metric-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  letter-spacing: 0.04em;
}

@media (max-width: 720px) {
  .why-us { padding: 72px 0; }
  .why-grid { grid-template-columns: 1fr; gap: 10px; }
  .why-card { padding: 26px 22px; }
  .why-title { font-size: 17px; }
  .why-desc { font-size: 13px; }
  .why-metric-num { font-size: 20px; }
}

/* ================================================
   MID CTA - \uD398\uC774\uC9C0 \uC911\uAC04 \uC0C1\uB2F4 \uB760
   ================================================ */
.mid-cta {
  padding: 56px 0;
  background: var(--brown);
  color: var(--white);
  position: relative;
  overflow: hidden;
}
.mid-cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--orange) 0%, var(--orange) 70%, var(--orange-tint) 70%, var(--orange-tint) 100%);
}
.mid-cta-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 36px;
  align-items: center;
}
.mid-cta-title {
  font-size: clamp(22px, 2.6vw, 28px);
  font-weight: 800;
  color: var(--white);
  letter-spacing: -0.03em;
  margin: 0 0 8px;
  line-height: 1.25;
}
.mid-cta-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
  max-width: 540px;
}
.mid-cta-phone {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-decoration: none;
  background: var(--orange);
  color: var(--white);
  padding: 18px 28px;
  border-radius: 14px;
  transition: transform .15s ease, background .15s ease;
}
.mid-cta-phone:hover {
  background: var(--orange-deep);
  transform: translateY(-1px);
}
.mid-cta-phone-label {
  font-size: 10px;
  letter-spacing: 0.18em;
  font-weight: 700;
  opacity: 0.85;
  margin-bottom: 4px;
}
.mid-cta-phone-num {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}

@media (max-width: 720px) {
  .mid-cta { padding: 44px 0; }
  .mid-cta-inner { grid-template-columns: 1fr; gap: 22px; }
  .mid-cta-phone {
    align-items: center;
    padding: 16px 22px;
  }
  .mid-cta-phone-num { font-size: 20px; }
}

/* ================================================
   HOME FAQ - \uBA54\uC778 \uD398\uC774\uC9C0\uC6A9 \uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38
   ================================================ */
.home-faq {
  padding: 100px 0;
  background: var(--ivory);
  border-top: 0.5px solid var(--line);
}
.home-faq .sec-title { max-width: 780px; }
.home-faq .sec-sub { max-width: 620px; margin-bottom: 40px; }

.home-faq-list {
  max-width: 820px;
  margin: 0 auto;
}

@media (max-width: 720px) {
  .home-faq { padding: 72px 0; }
}
`;

// node_modules/hono/dist/jsx/constants.js
var DOM_RENDERER = /* @__PURE__ */ Symbol("RENDERER");
var DOM_ERROR_HANDLER = /* @__PURE__ */ Symbol("ERROR_HANDLER");
var DOM_INTERNAL_TAG = /* @__PURE__ */ Symbol("INTERNAL");
var PERMALINK = /* @__PURE__ */ Symbol("PERMALINK");

// node_modules/hono/dist/jsx/dom/utils.js
var setInternalTagFlag = (fn) => {
  ;
  fn[DOM_INTERNAL_TAG] = true;
  return fn;
};

// node_modules/hono/dist/jsx/dom/context.js
var createContextProviderFunction = (values) => ({ value, children }) => {
  if (!children) {
    return void 0;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER] = (err) => {
    values.pop();
    throw err;
  };
  return res;
};

// node_modules/hono/dist/jsx/context.js
var globalContexts = [];
var createContext = (defaultValue) => {
  const values = [defaultValue];
  const context = (props) => {
    values.push(props.value);
    let string;
    try {
      string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode("", {}, props.children) : props.children).toString() : "";
    } catch (e) {
      values.pop();
      throw e;
    }
    if (string instanceof Promise) {
      return string.finally(() => values.pop()).then((resString) => raw(resString, resString.callbacks));
    } else {
      values.pop();
      return raw(string);
    }
  };
  context.values = values;
  context.Provider = context;
  context[DOM_RENDERER] = createContextProviderFunction(values);
  globalContexts.push(context);
  return context;
};
var useContext = (context) => {
  return context.values.at(-1);
};

// node_modules/hono/dist/jsx/intrinsic-element/common.js
var deDupeKeyMap = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers = {};
var dataPrecedenceAttr = "data-precedence";
var isStylesheetLinkWithPrecedence = (props) => props.rel === "stylesheet" && "precedence" in props;
var shouldDeDupeByKey = (tagName, supportSort) => {
  if (tagName === "link") {
    return supportSort;
  }
  return deDupeKeyMap[tagName].length > 0;
};

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var components_exports = {};
__export(components_exports, {
  button: () => button,
  form: () => form,
  input: () => input,
  link: () => link,
  meta: () => meta,
  script: () => script,
  style: () => style,
  title: () => title
});

// node_modules/hono/dist/jsx/children.js
var toArray = (children) => Array.isArray(children) ? children : [children];

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var metaTagMap = /* @__PURE__ */ new WeakMap();
var insertIntoHead = (tagName, tag, props, precedence) => ({ buffer, context }) => {
  if (!buffer) {
    return;
  }
  const map = metaTagMap.get(context) || {};
  metaTagMap.set(context, map);
  const tags = map[tagName] ||= [];
  let duped = false;
  const deDupeKeys = deDupeKeyMap[tagName];
  const deDupeByKey = shouldDeDupeByKey(tagName, precedence !== void 0);
  if (deDupeByKey) {
    LOOP:
      for (const [, tagProps] of tags) {
        if (tagName === "link" && !(tagProps.rel === "stylesheet" && tagProps[dataPrecedenceAttr] !== void 0)) {
          continue;
        }
        for (const key of deDupeKeys) {
          if ((tagProps?.[key] ?? null) === props?.[key]) {
            duped = true;
            break LOOP;
          }
        }
      }
  }
  if (duped) {
    buffer[0] = buffer[0].replaceAll(tag, "");
  } else if (deDupeByKey || tagName === "link") {
    tags.push([tag, props, precedence]);
  } else {
    tags.unshift([tag, props, precedence]);
  }
  if (buffer[0].indexOf("</head>") !== -1) {
    let insertTags;
    if (tagName === "link" || precedence !== void 0) {
      const precedences = [];
      insertTags = tags.map(([tag2, , tagPrecedence], index) => {
        if (tagPrecedence === void 0) {
          return [tag2, Number.MAX_SAFE_INTEGER, index];
        }
        let order = precedences.indexOf(tagPrecedence);
        if (order === -1) {
          precedences.push(tagPrecedence);
          order = precedences.length - 1;
        }
        return [tag2, order, index];
      }).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(([tag2]) => tag2);
    } else {
      insertTags = tags.map(([tag2]) => tag2);
    }
    insertTags.forEach((tag2) => {
      buffer[0] = buffer[0].replaceAll(tag2, "");
    });
    buffer[0] = buffer[0].replace(/(?=<\/head>)/, insertTags.join(""));
  }
};
var returnWithoutSpecialBehavior = (tag, children, props) => raw(new JSXNode(tag, props, toArray(children ?? [])).toString());
var documentMetadataTag = (tag, children, props, sort) => {
  if ("itemProp" in props) {
    return returnWithoutSpecialBehavior(tag, children, props);
  }
  let { precedence, blocking, ...restProps } = props;
  precedence = sort ? precedence ?? "" : void 0;
  if (sort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const string = new JSXNode(tag, restProps, toArray(children || [])).toString();
  if (string instanceof Promise) {
    return string.then(
      (resString) => raw(string, [
        ...resString.callbacks || [],
        insertIntoHead(tag, resString, restProps, precedence)
      ])
    );
  } else {
    return raw(string, [insertIntoHead(tag, string, restProps, precedence)]);
  }
};
var title = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2) {
    const context = useContext(nameSpaceContext2);
    if (context === "svg" || context === "head") {
      return new JSXNode(
        "title",
        props,
        toArray(children ?? [])
      );
    }
  }
  return documentMetadataTag("title", children, props, false);
};
var script = ({
  children,
  ...props
}) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (["src", "async"].some((k) => !props[k]) || nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("script", children, props);
  }
  return documentMetadataTag("script", children, props, false);
};
var style = ({
  children,
  ...props
}) => {
  if (!["href", "precedence"].every((k) => k in props)) {
    return returnWithoutSpecialBehavior("style", children, props);
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag("style", children, props, true);
};
var link = ({ children, ...props }) => {
  if (["onLoad", "onError"].some((k) => k in props) || props.rel === "stylesheet" && (!("precedence" in props) || "disabled" in props)) {
    return returnWithoutSpecialBehavior("link", children, props);
  }
  return documentMetadataTag("link", children, props, isStylesheetLinkWithPrecedence(props));
};
var meta = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("meta", children, props);
  }
  return documentMetadataTag("meta", children, props, false);
};
var newJSXNode = (tag, { children, ...props }) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new JSXNode(tag, props, toArray(children ?? []))
);
var form = (props) => {
  if (typeof props.action === "function") {
    props.action = PERMALINK in props.action ? props.action[PERMALINK] : void 0;
  }
  return newJSXNode("form", props);
};
var formActionableElement = (tag, props) => {
  if (typeof props.formAction === "function") {
    props.formAction = PERMALINK in props.formAction ? props.formAction[PERMALINK] : void 0;
  }
  return newJSXNode(tag, props);
};
var input = (props) => formActionableElement("input", props);
var button = (props) => formActionableElement("button", props);

// node_modules/hono/dist/jsx/utils.js
var normalizeElementKeyMap = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey = (key) => normalizeElementKeyMap.get(key) || key;
var invalidAttributeNameCharRe = /[\s"'<>/=`\\\x00-\x1f\x7f-\x9f]/;
var isValidAttributeName = (name) => {
  const len = name.length;
  if (len === 0) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    const c = name.charCodeAt(i);
    if (!(c >= 97 && c <= 122 || // a-z
    c >= 65 && c <= 90 || // A-Z
    c >= 48 && c <= 57 || // 0-9
    c === 45 || // -
    c === 95 || // _
    c === 46 || // .
    c === 58)) {
      return !invalidAttributeNameCharRe.test(name);
    }
  }
  return true;
};
var styleObjectForEach = (style2, fn) => {
  for (const [k, v] of Object.entries(style2)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    fn(
      key,
      v == null ? null : typeof v === "number" ? !key.match(
        /^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/
      ) ? `${v}px` : `${v}` : v
    );
  }
};

// node_modules/hono/dist/jsx/base.js
var nameSpaceContext = void 0;
var getNameSpaceContext = () => nameSpaceContext;
var toSVGAttributeName = (key) => /[A-Z]/.test(key) && // Presentation attributes are findable in style object. "clip-path", "font-size", "stroke-width", etc.
// Or other un-deprecated kebab-case attributes. "overline-position", "paint-order", "strikethrough-position", etc.
key.match(
  /^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/
) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "download",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = (children, buffer) => {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === void 0) {
      continue;
    } else if (child instanceof JSXNode) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      ;
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
};
var JSXNode = class {
  tag;
  props;
  key;
  children;
  isEscaped = true;
  localContexts;
  constructor(tag, props, children) {
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  get type() {
    return this.tag;
  }
  // Added for compatibility with libraries that rely on React's internal structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get ref() {
    return this.props.ref || null;
  }
  toString() {
    const buffer = [""];
    this.localContexts?.forEach(([context, value]) => {
      context.values.push(value);
    });
    try {
      this.toStringToBuffer(buffer);
    } finally {
      this.localContexts?.forEach(([context]) => {
        context.values.pop();
      });
    }
    return buffer.length === 1 ? "callbacks" in buffer ? resolveCallbackSync(raw(buffer[0], buffer.callbacks)).toString() : buffer[0] : stringBufferToString(buffer, buffer.callbacks);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const normalizeKey = nameSpaceContext && useContext(nameSpaceContext) === "svg" ? (key) => toSVGAttributeName(normalizeIntrinsicElementKey(key)) : (key) => normalizeIntrinsicElementKey(key);
    for (let [key, v] of Object.entries(props)) {
      key = normalizeKey(key);
      if (!isValidAttributeName(key)) {
        continue;
      }
      if (key === "children") {
      } else if (key === "style" && typeof v === "object") {
        let styleStr = "";
        styleObjectForEach(v, (property, value) => {
          if (value != null) {
            styleStr += `${styleStr ? ";" : ""}${property}:${value}`;
          }
        });
        buffer[0] += ' style="';
        escapeToBuffer(styleStr, buffer);
        buffer[0] += '"';
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === void 0) {
      } else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
        }
        children = [raw(v.__html)];
      } else if (v instanceof Promise) {
        buffer[0] += ` ${key}="`;
        buffer.unshift('"', v);
      } else if (typeof v === "function") {
        if (!key.startsWith("on") && key !== "ref") {
          throw new Error(`Invalid prop '${key}' of type 'function' supplied to '${tag}'.`);
        }
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag) && children.length === 0) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFunctionNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    const { children } = this;
    const props = { ...this.props };
    if (children.length) {
      props.children = children.length === 1 ? children[0] : children;
    }
    const res = this.tag.call(null, props);
    if (typeof res === "boolean" || res == null) {
      return;
    } else if (res instanceof Promise) {
      if (globalContexts.length === 0) {
        buffer.unshift("", res);
      } else {
        const currentContexts = globalContexts.map((c) => [c, c.values.at(-1)]);
        buffer.unshift(
          "",
          res.then((childRes) => {
            if (childRes instanceof JSXNode) {
              childRes.localContexts = currentContexts;
            }
            return childRes;
          })
        );
      }
    } else if (res instanceof JSXNode) {
      res.toStringToBuffer(buffer);
    } else if (typeof res === "number" || res.isEscaped) {
      buffer[0] += res;
      if (res.callbacks) {
        buffer.callbacks ||= [];
        buffer.callbacks.push(...res.callbacks);
      }
    } else {
      escapeToBuffer(res, buffer);
    }
  }
};
var JSXFragmentNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var initDomRenderer = false;
var jsxFn = (tag, props, children) => {
  if (!initDomRenderer) {
    for (const k in domRenderers) {
      ;
      components_exports[k][DOM_RENDERER] = domRenderers[k];
    }
    initDomRenderer = true;
  }
  if (typeof tag === "function") {
    return new JSXFunctionNode(tag, props, children);
  } else if (components_exports[tag]) {
    return new JSXFunctionNode(
      components_exports[tag],
      props,
      children
    );
  } else if (tag === "svg" || tag === "head") {
    nameSpaceContext ||= createContext("");
    return new JSXNode(tag, props, [
      new JSXFunctionNode(
        nameSpaceContext,
        {
          value: tag
        },
        children
      )
    ]);
  } else {
    return new JSXNode(tag, props, children);
  }
};
var Fragment = ({
  children
}) => {
  return new JSXFragmentNode(
    "",
    {
      children
    },
    Array.isArray(children) ? children : children ? [children] : []
  );
};

// node_modules/hono/dist/jsx/jsx-dev-runtime.js
function jsxDEV(tag, props, key) {
  let node;
  if (!props || !("children" in props)) {
    node = jsxFn(tag, props, []);
  } else {
    const children = props.children;
    node = Array.isArray(children) ? jsxFn(tag, props, children) : jsxFn(tag, props, [children]);
  }
  node.key = key;
  return node;
}

// src/components/Layout.tsx
var Layout = ({ meta: meta2, children }) => {
  return /* @__PURE__ */ jsxDEV("html", { lang: "ko", children: [
    /* @__PURE__ */ jsxDEV("head", { children: [
      /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "naver-site-verification", content: "4bff453e20c339b2aeaaa47c842b7e1a4c579ec9" }),
      /* @__PURE__ */ jsxDEV("title", { children: meta2.title }),
      /* @__PURE__ */ jsxDEV("meta", { name: "description", content: meta2.description }),
      meta2.canonical && /* @__PURE__ */ jsxDEV("link", { rel: "canonical", href: meta2.canonical }),
      /* @__PURE__ */ jsxDEV("link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon-180.png" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "shortcut icon", href: "/favicon.ico" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "theme-color", content: "#FF5500" }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:title", content: meta2.title }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:description", content: meta2.description }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:type", content: "website" }),
      meta2.canonical && /* @__PURE__ */ jsxDEV("meta", { property: "og:url", content: meta2.canonical }),
      meta2.ogImage && /* @__PURE__ */ jsxDEV("meta", { property: "og:image", content: meta2.ogImage }),
      /* @__PURE__ */ jsxDEV("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "twitter:title", content: meta2.title }),
      /* @__PURE__ */ jsxDEV("meta", { name: "twitter:description", content: meta2.description }),
      /* @__PURE__ */ jsxDEV("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" }),
      /* @__PURE__ */ jsxDEV(
        "link",
        {
          href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap",
          rel: "stylesheet"
        }
      ),
      /* @__PURE__ */ jsxDEV(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        }
      ),
      /* @__PURE__ */ jsxDEV("style", { dangerouslySetInnerHTML: { __html: globalStyles } }),
      /* @__PURE__ */ jsxDEV(
        "script",
        {
          type: "application/ld+json",
          dangerouslySetInnerHTML: {
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://thesavestore.com/#organization",
                  name: "\uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4",
                  url: "https://thesavestore.com",
                  logo: "https://thesavestore.com/favicon-512.png",
                  image: "https://thesavestore.com/images/install/wear.jpg",
                  telephone: "+82-10-9677-2356",
                  description: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 \xB7 \uD3EC\uC2A4\uAE30 \xB7 \uD0A4\uC624\uC2A4\uD06C\uBD80\uD130 \uC778\uD130\uB137 \xB7 CCTV \xB7 \uC778\uD14C\uB9AC\uC5B4\uAE4C\uC9C0. \uB9E4\uC7A5\uC5D0 \uD544\uC694\uD55C \uBAA8\uB4E0 \uC7A5\uBE44\uB97C \uC804\uAD6D 17\uAC1C \uC2DC\xB7\uB3C4 \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uCD9C\uC7A5 \uC124\uCE58\uD569\uB2C8\uB2E4.",
                  areaServed: { "@type": "Country", name: "South Korea" },
                  contactPoint: {
                    "@type": "ContactPoint",
                    telephone: "+82-10-9677-2356",
                    contactType: "customer service",
                    availableLanguage: ["Korean"]
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": "https://thesavestore.com/#website",
                  url: "https://thesavestore.com",
                  name: "\uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4",
                  inLanguage: "ko-KR",
                  publisher: { "@id": "https://thesavestore.com/#organization" }
                }
              ]
            })
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxDEV("body", { children })
  ] });
};

// src/components/Navigation.tsx
var PHONE = "010-9677-2356";
var PHONE_HREF = "tel:010-9677-2356";
var Navigation = () => /* @__PURE__ */ jsxDEV(Fragment, { children: [
  /* @__PURE__ */ jsxDEV("div", { class: "topbar", children: /* @__PURE__ */ jsxDEV("div", { class: "container topbar-inner", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "topbar-left", children: "\uC804\uAD6D \xB7 \uC804\uBB38 \uB9E4\uB2C8\uC800 \uCD9C\uC7A5 \xB7 \uBB34\uB8CC \uACAC\uC801" }),
    /* @__PURE__ */ jsxDEV("div", { class: "topbar-right", children: /* @__PURE__ */ jsxDEV("a", { href: PHONE_HREF, class: "topbar-phone", children: [
      "\u{1F4DE} ",
      PHONE
    ] }) })
  ] }) }),
  /* @__PURE__ */ jsxDEV("nav", { class: "nav", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "container nav-inner", children: [
      /* @__PURE__ */ jsxDEV("a", { href: "/", class: "logo", children: [
        /* @__PURE__ */ jsxDEV("svg", { class: "logo-mark", width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "#FF5500", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxDEV("path", { d: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" }),
          /* @__PURE__ */ jsxDEV("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
          /* @__PURE__ */ jsxDEV("path", { d: "M16 10a4 4 0 0 1-8 0" })
        ] }),
        /* @__PURE__ */ jsxDEV("span", { class: "logo-text", children: "\uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4" })
      ] }),
      /* @__PURE__ */ jsxDEV("button", { type: "button", class: "nav-toggle", "aria-label": "\uBA54\uB274 \uC5F4\uAE30", "data-nav-toggle": true, children: [
        /* @__PURE__ */ jsxDEV("span", {}),
        /* @__PURE__ */ jsxDEV("span", {}),
        /* @__PURE__ */ jsxDEV("span", {})
      ] }),
      /* @__PURE__ */ jsxDEV("ul", { class: "nav-menu", "data-nav-menu": true, children: [
        /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#regions", class: "nav-link", children: "\uC9C0\uC5ED" }) }),
        /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#contact", class: "nav-cta", children: "\uBB34\uB8CC \uACAC\uC801" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV(
      "script",
      {
        dangerouslySetInnerHTML: {
          __html: `
(function() {
  // \uD584\uBC84\uAC70 \uD1A0\uAE00
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-nav-menu]');
  if (toggle && menu) {
    toggle.addEventListener('click', function() {
      menu.classList.toggle('open');
      toggle.classList.toggle('open');
    });
  }

  // \uBA54\uAC00\uBA54\uB274 \uD074\uB9AD \uD1A0\uAE00 (\uBAA8\uBC14\uC77C/\uD130\uCE58 \uB514\uBC14\uC774\uC2A4 \uB300\uC751)
  var trigger = document.querySelector('[data-mega-trigger]');
  var btn = document.querySelector('[data-mega-btn]');
  if (trigger && btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      trigger.classList.toggle('open');
    });
    // \uC678\uBD80 \uD074\uB9AD \uC2DC \uB2EB\uAE30
    document.addEventListener('click', function(e) {
      if (!trigger.contains(e.target)) {
        trigger.classList.remove('open');
      }
    });
  }
})();
          `
        }
      }
    )
  ] })
] });
var FloatingPhone = () => /* @__PURE__ */ jsxDEV("a", { href: PHONE_HREF, class: "floating-phone", children: [
  "\u{1F4DE} ",
  /* @__PURE__ */ jsxDEV("span", { children: "\uBB34\uB8CC \uC0C1\uB2F4" })
] });

// src/components/Footer.tsx
var Footer = () => /* @__PURE__ */ jsxDEV("footer", { children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "footer-main", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "footer-brand", children: [
      /* @__PURE__ */ jsxDEV("a", { href: "/", class: "logo", children: [
        /* @__PURE__ */ jsxDEV("svg", { class: "logo-mark", width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "#FF5500", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxDEV("path", { d: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" }),
          /* @__PURE__ */ jsxDEV("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
          /* @__PURE__ */ jsxDEV("path", { d: "M16 10a4 4 0 0 1-8 0" })
        ] }),
        /* @__PURE__ */ jsxDEV("span", { class: "logo-text", children: "\uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4" })
      ] }),
      /* @__PURE__ */ jsxDEV("p", { class: "footer-tagline", children: [
        "\uC804\uAD6D \uB9E4\uC7A5 \uC124\uBE44 \uC6D0\uC2A4\uD1B1 \uC124\uCE58",
        /* @__PURE__ */ jsxDEV("br", {}),
        "\uC804\uBB38 \uB9E4\uB2C8\uC800 \uCD9C\uC7A5"
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "footer-contact", children: [
        /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "footer-phone", children: "010-9677-2356" }),
        /* @__PURE__ */ jsxDEV("div", { class: "footer-hours", children: "365\uC77C \uC5F0\uC911\uBB34\uD734" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "footer-cols", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "footer-col", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "footer-col-label", children: "\uC2E0\uADDC \uC7A5\uBE44" }),
        /* @__PURE__ */ jsxDEV("ul", { children: [
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uD3EC\uC2A4\uAE30", children: "\uD3EC\uC2A4\uAE30" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uCE74\uB4DC\uB2E8\uB9D0\uAE30", children: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uD0A4\uC624\uC2A4\uD06C", children: "\uD0A4\uC624\uC2A4\uD06C" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uD14C\uC774\uBE14\uC624\uB354", children: "\uD14C\uC774\uBE14\uC624\uB354" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/CCTV\uC124\uCE58", children: "CCTV" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uC778\uD130\uB137\uC124\uCE58", children: "\uC778\uD130\uB137" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "footer-col", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "footer-col-label", children: "\uAC74\uCD95" }),
        /* @__PURE__ */ jsxDEV("ul", { children: [
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uAC74\uCD95\uCCA0\uAC70", children: "\uCCA0\uAC70" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uAC74\uCD95\uC778\uD14C\uB9AC\uC5B4", children: "\uC778\uD14C\uB9AC\uC5B4" }) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "footer-col-label", style: "margin-top:18px", children: "\uAE30\uD0C0" }),
        /* @__PURE__ */ jsxDEV("ul", { children: /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uC790\uD310\uAE30", children: "\uC790\uD310\uAE30" }) }) })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "footer-col", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "footer-col-label", children: "\uBC14\uB85C\uAC00\uAE30" }),
        /* @__PURE__ */ jsxDEV("ul", { children: [
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#industries", children: "\uC5C5\uC885\uBCC4 \uB9DE\uCDA4 \uAD6C\uC131" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#regions", children: "\uC804\uAD6D \uC9C0\uC5ED" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#process", children: "\uC124\uCE58 \uC808\uCC28" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#faq", children: "\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38" }) }),
          /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#contact", children: "\uBB34\uB8CC \uACAC\uC801 \uC0C1\uB2F4" }) })
        ] })
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "footer-bottom", children: [
    /* @__PURE__ */ jsxDEV("div", { children: "\xA9 2026 THE SAVE STORE \xB7 ALL RIGHTS RESERVED" }),
    /* @__PURE__ */ jsxDEV("div", { children: "\uC774\uC6A9\uC57D\uAD00 \xB7 \uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68" })
  ] })
] }) });

// src/components/sections/Hero.tsx
var Hero = ({ locationContext }) => {
  const chipText = locationContext ? `${locationContext} \uCD9C\uC7A5 \uC124\uCE58 \uAC00\uB2A5` : "\uC804\uAD6D 17\uAC1C \uC2DC\xB7\uB3C4 \uCD9C\uC7A5 \uC124\uCE58";
  return /* @__PURE__ */ jsxDEV("section", { class: "hero", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("div", { class: "hero-grid", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "hero-text", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "hero-chip", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "hero-chip-dot" }),
        /* @__PURE__ */ jsxDEV("span", { children: chipText })
      ] }),
      /* @__PURE__ */ jsxDEV("h1", { children: [
        "\uB9E4\uC7A5\uC5D0 \uD544\uC694\uD55C",
        /* @__PURE__ */ jsxDEV("br", {}),
        "\uBAA8\uB4E0 \uC7A5\uBE44\uB97C",
        /* @__PURE__ */ jsxDEV("br", {}),
        /* @__PURE__ */ jsxDEV("span", { class: "accent", children: "\uD55C \uBC88\uC5D0." })
      ] }),
      /* @__PURE__ */ jsxDEV("p", { class: "hero-sub", children: [
        "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 \xB7 \uD3EC\uC2A4\uAE30 \xB7 \uD0A4\uC624\uC2A4\uD06C\uBD80\uD130 \uC778\uD130\uB137 \xB7 CCTV \xB7 \uC778\uD14C\uB9AC\uC5B4\uAE4C\uC9C0.",
        /* @__PURE__ */ jsxDEV("br", {}),
        "\uB9E4\uC7A5 \uD558\uB098 \uCC28\uB9AC\uB294\uB370 \uD544\uC694\uD55C \uBAA8\uB4E0 \uAC78 \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uCD9C\uC7A5 \uC124\uCE58\uD569\uB2C8\uB2E4."
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "hero-ctas", children: [
        /* @__PURE__ */ jsxDEV("a", { href: "#contact", class: "btn btn-primary", children: "\uBB34\uB8CC \uACAC\uC801 \uBC1B\uAE30 \u2192" }),
        /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "btn btn-outline", children: "\u{1F4DE} 010-9677-2356" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "hero-stats", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "stat-num", children: [
            "1\uB9CC\uAC74",
            /* @__PURE__ */ jsxDEV("span", { class: "unit", children: "+" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "stat-label", children: "\uB204\uC801 \uC124\uCE58" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "stat-num", children: [
            "17",
            /* @__PURE__ */ jsxDEV("span", { class: "unit", children: "\uAC1C" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "stat-label", children: "\uC804\uAD6D \uC2DC\xB7\uB3C4" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "stat-num", children: [
            "9",
            /* @__PURE__ */ jsxDEV("span", { class: "unit", children: "\uC885" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "stat-label", children: "\uCDE8\uAE09 \uC7A5\uBE44" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "stat-num", children: [
            "365",
            /* @__PURE__ */ jsxDEV("span", { class: "unit", children: "\uC77C" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "stat-label", children: "\uC0C1\uB2F4 \uAC00\uB2A5" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "hero-visual", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "device device-pos", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "device-header", children: "\uC624\uB298 \uB9E4\uCD9C \uD604\uD669" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-title", children: "\uB9E4\uC7A5 POS" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-amount", children: "\u20A9 1,240,800" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "\uACB0\uC81C \uAC74\uC218" }),
          /* @__PURE__ */ jsxDEV("span", { children: "87\uAC74" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "\uD3C9\uADE0 \uB2E8\uAC00" }),
          /* @__PURE__ */ jsxDEV("span", { children: "14,259\uC6D0" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "VAN \uC218\uC218\uB8CC" }),
          /* @__PURE__ */ jsxDEV("span", { children: "0.8%" })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "device device-card", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "device-tag", children: "APPROVED" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-header", style: "opacity:0.85;", children: "CARD PAYMENT" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-amount", children: "\u20A9 34,500" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "\uAD6D\uBBFC\uCE74\uB4DC" }),
          /* @__PURE__ */ jsxDEV("span", { children: "\uC77C\uC2DC\uBD88" })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "device device-kiosk", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "device-header", style: "color:#FF5500; opacity:1;", children: "\uC8FC\uBB38 \uD604\uD669" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-title", children: "\uD0A4\uC624\uC2A4\uD06C" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", style: "font-size: 12px;", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "#241" }),
          /* @__PURE__ */ jsxDEV("span", { style: "color:#FF5500;", children: "\uC870\uB9AC\uC911" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", style: "font-size: 12px;", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "#242" }),
          /* @__PURE__ */ jsxDEV("span", { children: "\uB300\uAE30" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", style: "font-size: 12px;", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "#243" }),
          /* @__PURE__ */ jsxDEV("span", { children: "\uC811\uC218" })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "float-badge badge-1", children: "\u26A1 \uC804\uBB38 \uC124\uCE58" }),
      /* @__PURE__ */ jsxDEV("div", { class: "float-badge badge-2", children: "\u{1F3AF} \uC804\uAD6D \uCD9C\uC7A5" })
    ] })
  ] }) }) });
};

// src/components/sections/CoreProducts.tsx
var coreEquipments = [
  {
    name: "\uD3EC\uC2A4\uAE30 (POS)",
    image: "/images/equipment/equipment-pos.png",
    targetSlug: "\uD3EC\uC2A4\uAE30",
    useCase: "\uC77C\uBC18 \uC2DD\uB2F9\xB7\uCE74\uD398\xB7\uD3B8\uC758\uC810. \uC8FC\uBB38\xB7\uACB0\uC81C\xB7\uB9E4\uCD9C \uAD00\uB9AC \uC62C\uC778\uC6D0"
  },
  {
    name: "\uC790\uB3D9\uCEE4\uD305\uB2E8\uB9D0\uAE30",
    image: "/images/equipment/equipment-auto-cutting.png",
    targetSlug: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    useCase: "\uC601\uC218\uC99D \uC790\uB3D9 \uC808\uB2E8. \uD3B8\uC758\uC810\xB7\uC57D\uAD6D\xB7\uBCD1\uC6D0 \uB4F1 \uACE0\uD68C\uC804 \uB9E4\uC7A5"
  },
  {
    name: "\uC720\uC120\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    image: "/images/equipment/equipment-wired-card.png",
    targetSlug: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    useCase: "\uC548\uC815\uC801\uC778 \uACB0\uC81C\uAC00 \uD544\uC694\uD55C \uCE74\uC6B4\uD130 \uACE0\uC815\uD615 \uB9E4\uC7A5"
  },
  {
    name: "\uD1A0\uC2A4\uD504\uB860\uD2B8",
    image: "/images/equipment/equipment-toss.png",
    targetSlug: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    useCase: "\uAC04\uD3B8\uACB0\uC81C \uC911\uC2EC 1\uC778 \uB9E4\uC7A5\xB7\uACF5\uBC29\xB7\uD31D\uC5C5 \uC2A4\uD1A0\uC5B4"
  },
  {
    name: "\uBB34\uC120\uB2E8\uB9D0\uAE30",
    image: "/images/equipment/equipment-wireless.png",
    targetSlug: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    useCase: "\uD14C\uC774\uBE14 \uACB0\uC81C\uAC00 \uD544\uC694\uD55C \uC74C\uC2DD\uC810\xB7\uC57C\uC678 \uB9E4\uC7A5\xB7\uBC30\uB2EC"
  },
  {
    name: "\uBE14\uB8E8\uD22C\uC2A4\uB2E8\uB9D0\uAE30",
    image: "/images/equipment/equipment-bluetooth.png",
    targetSlug: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    useCase: "\uD734\uB300\uC131\uC774 \uC911\uC694\uD55C \uD478\uB4DC\uD2B8\uB7ED\xB7\uC774\uB3D9\uC2DD \uB9E4\uC7A5\xB7\uBC30\uB2EC"
  },
  {
    name: "\uD14C\uC774\uBE14\uC624\uB354",
    image: "/images/equipment/equipment-table-order.png",
    targetSlug: "\uD14C\uC774\uBE14\uC624\uB354",
    useCase: "\uACE0\uAE09 \uB808\uC2A4\uD1A0\uB791\xB7\uD55C\uC2DD\uB2F9. \uD14C\uC774\uBE14\uC5D0\uC11C \uC9C1\uC811 \uC8FC\uBB38"
  },
  {
    name: "\uBBF8\uB2C8\uD0A4\uC624\uC2A4\uD06C",
    image: "/images/equipment/equipment-mini-kiosk.png",
    targetSlug: "\uD0A4\uC624\uC2A4\uD06C",
    useCase: "\uC18C\uD615 \uCE74\uD398\xB7\uBD84\uC2DD\uC9D1. \uC791\uC740 \uACF5\uAC04\uC5D0\uB3C4 \uC124\uCE58 \uAC00\uB2A5"
  },
  {
    name: "\uD0A4\uC624\uC2A4\uD06C",
    image: "/images/equipment/equipment-kiosk.png",
    targetSlug: "\uD0A4\uC624\uC2A4\uD06C",
    useCase: "\uD504\uB79C\uCC28\uC774\uC988\xB7\uB300\uD615 \uB9E4\uC7A5. \uBB34\uC778 \uC8FC\uBB38\xB7\uACB0\uC81C \uC804\uBA74\uD654"
  }
];
var CoreProducts = ({ locationPath }) => {
  const getEquipHref = (targetSlug) => locationPath ? `/${locationPath}/${targetSlug}` : `/\uC81C\uD488/${targetSlug}`;
  return /* @__PURE__ */ jsxDEV("section", { class: "core-products", id: "products", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "CORE EQUIPMENT" }),
      /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
        "\uACB0\uC81C\uBD80\uD130 \uC8FC\uBB38\uAE4C\uC9C0",
        /* @__PURE__ */ jsxDEV("br", {}),
        /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uD575\uC2EC \uC7A5\uBE44 9\uC885." })
      ] }),
      /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: [
        "\uB9E4\uC7A5 \uADDC\uBAA8\uC640 \uC5C5\uC885\uC5D0 \uB9DE\uB294 \uB2E8\uB9D0\uAE30\uB97C \uACE8\uB77C\uBCF4\uC138\uC694.",
        /* @__PURE__ */ jsxDEV("br", {}),
        "\uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uD604\uC7A5 \uBC29\uBB38\uD574 \uC124\uCE58\uAE4C\uC9C0 \uC644\uB8CC\uD569\uB2C8\uB2E4."
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "equipment-grid", children: coreEquipments.map((eq) => /* @__PURE__ */ jsxDEV("a", { href: getEquipHref(eq.targetSlug), class: "equipment-card", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "equipment-name-top", children: eq.name }),
        /* @__PURE__ */ jsxDEV("div", { class: "equipment-thumb", children: [
          /* @__PURE__ */ jsxDEV("img", { src: eq.image, alt: eq.name, loading: "lazy" }),
          /* @__PURE__ */ jsxDEV("div", { class: "equipment-overlay", children: /* @__PURE__ */ jsxDEV("div", { class: "equipment-overlay-text", children: eq.useCase }) })
        ] })
      ] })) })
    ] }),
    /* @__PURE__ */ jsxDEV("script", { dangerouslySetInnerHTML: {
      __html: `
          (function() {
            if (window.matchMedia('(hover: hover)').matches) return; // PC\uB294 \uD638\uBC84\uB85C
            document.querySelectorAll('.equipment-card').forEach(function(card) {
              card.addEventListener('click', function(e) {
                if (!card.classList.contains('active')) {
                  e.preventDefault();
                  document.querySelectorAll('.equipment-card.active').forEach(function(c) {
                    if (c !== card) c.classList.remove('active');
                  });
                  card.classList.add('active');
                }
              });
            });
          })();
        `
    } })
  ] });
};

// src/components/sections/InstallGallery.tsx
var installPhotos = [
  { src: "/images/install/wear.jpg", caption: "\uC6E8\uC5B4 \xB7 \uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { src: "/images/install/utm-academy.jpg", caption: "\uC720\uD22C\uC5E0\uD559\uC6D0 \xB7 \uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { src: "/images/install/yundal-research.jpg", caption: "\uC724\uB2EC\uC2EC\uB9AC\uC5B8\uC5B4\uD559\uC2B5\uC5F0\uAD6C\uC18C \xB7 \uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { src: "/images/install/iroun-kitchen.jpg", caption: "\uC774\uB85C\uC6B4\uD0A4\uCE5C \xB7 \uD3EC\uC2A4 + \uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { src: "/images/install/iroun-kitchen-2.jpg", caption: "\uC774\uB85C\uC6B4\uD0A4\uCE5C \xB7 \uD3EC\uC2A4\uAE30" },
  { src: "/images/install/leehj-hair.jpg", caption: "\uC774\uD604\uC9C4\uD5E4\uC5B4\uD504\uB80C\uC988 \xB7 \uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { src: "/images/install/dumbbell.jpg", caption: "\uC8FC\uC2DD\uD68C\uC0AC \uB364\uBCA8\uC774 \xB7 \uD0A4\uC624\uC2A4\uD06C" },
  { src: "/images/install/pyeongtaek-bellcoffee.jpg", caption: "\uD3C9\uD0DD \uBCA8\uCEE4\uD53C \xB7 \uD3EC\uC2A4\uAE30" },
  { src: "/images/install/fresh-market.jpg", caption: "\uD504\uB808\uC26C\uB9C8\uCF13 \xB7 \uD3EC\uC2A4\uAE30" },
  { src: "/images/install/hoban.jpg", caption: "\uD638\uBC18 \xB7 \uD0A4\uC624\uC2A4\uD06C" },
  { src: "/images/install/darai-pocha.jpg", caption: "\uB2E4\uB77C\uC774\uD3EC\uCC28 \xB7 \uD3EC\uC2A4\uAE30" },
  { src: "/images/install/dajeong-cheffood.jpg", caption: "\uB2E4\uC815\uC250\uD504\uD478\uB4DC \xB7 \uD0A4\uC624\uC2A4\uD06C" },
  { src: "/images/install/cafe-jacob.jpg", caption: "\uB354\uCE74\uD398\uC81C\uC774\uCF65 \xB7 \uD3EC\uC2A4\uAE30" },
  { src: "/images/install/bebe-stella.jpg", caption: "\uBCA0\uBCA0\uC2A4\uD154\uB77C \xB7 \uD3EC\uC2A4\uAE30" },
  { src: "/images/install/sanghae-therapy.jpg", caption: "\uC0C1\uD574\uD14C\uB77C\uD53C \xB7 \uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { src: "/images/install/ansan-coffeeday.jpg", caption: "\uC548\uC0B0 \uCEE4\uD53C\uB370\uC774 \xB7 \uD3EC\uC2A4\uAE30" },
  { src: "/images/install/elly-rolls.jpg", caption: "\uC5D8\uB9AC\uB864\uC2A4 \xB7 \uD3EC\uC2A4\uAE30" }
];
var InstallGallery = () => /* @__PURE__ */ jsxDEV("section", { class: "install-gallery", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "INSTALLATION" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      "\uC804\uAD6D \uB9E4\uC7A5\uC5D0 ",
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC124\uCE58 \uC644\uB8CC." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC2E4\uC81C \uC124\uCE58 \uD604\uC7A5 \uC0AC\uC9C4\uC744 \uD655\uC778\uD574\uBCF4\uC138\uC694." })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "install-slider", children: /* @__PURE__ */ jsxDEV("div", { class: "install-track", children: [
    installPhotos.map((p) => /* @__PURE__ */ jsxDEV("div", { class: "install-slide", children: [
      /* @__PURE__ */ jsxDEV("img", { src: p.src, alt: p.caption, loading: "lazy" }),
      /* @__PURE__ */ jsxDEV("div", { class: "install-caption", children: p.caption })
    ] })),
    installPhotos.map((p) => /* @__PURE__ */ jsxDEV("div", { class: "install-slide", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxDEV("img", { src: p.src, alt: "", loading: "lazy" }),
      /* @__PURE__ */ jsxDEV("div", { class: "install-caption", children: p.caption })
    ] }))
  ] }) })
] });

// src/components/sections/InstallReviews.tsx
var installReviews = [
  { quote: "\uACB0\uC81C \uC2B9\uC778 \uC18D\uB3C4\uAC00 \uD655\uC2E4\uD788 \uBE68\uB77C\uC838\uC11C \uC190\uB2D8 \uC904 \uC11C\uC788\uC744 \uB54C \uCC28\uC774\uB97C \uB290\uAEF4\uC694", store: "\uC6E8\uC5B4", equip: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { quote: "\uD559\uBD80\uBAA8\uB2D8 \uCE74\uB4DC \uACB0\uC81C\uB3C4 \uD55C \uBC88\uC5D0 \uAE54\uB054\uD558\uAC8C \uCC98\uB9AC\uB418\uB2C8\uAE4C \uB108\uBB34 \uD3B8\uD569\uB2C8\uB2E4", store: "\uC720\uD22C\uC5E0\uD559\uC6D0", equip: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { quote: "\uD3EC\uC2A4\uB791 \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \uC5F0\uB3D9\uAE4C\uC9C0 \uC9C1\uC6D0\uBD84\uC774 \uB2E4 \uD574\uC8FC\uC154\uC11C \uBC14\uB85C \uC601\uC5C5 \uC2DC\uC791\uD588\uC5B4\uC694", store: "\uC774\uB85C\uC6B4\uD0A4\uCE5C", equip: "\uD3EC\uC2A4\uAE30 + \uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { quote: "\uC791\uC740 \uB9E4\uC7A5\uC5D0 \uBD80\uB2F4 \uC5C6\uB294 \uC0AC\uC774\uC988\uACE0 \uC601\uC218\uC99D \uCD9C\uB825\uB3C4 \uAE68\uB057\uD558\uAC8C \uC798 \uB098\uC640\uC694", store: "\uC774\uD604\uC9C4\uD5E4\uC5B4\uD504\uB80C\uC988", equip: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30" },
  { quote: "\uD0A4\uC624\uC2A4\uD06C \uB4E4\uC774\uACE0 \uC810\uC2EC\uC2DC\uAC04 \uB300\uAE30\uC904\uC774 \uC0AC\uB77C\uC838\uC11C \uD68C\uC804\uC728\uC774 \uD655 \uC88B\uC544\uC84C\uC2B5\uB2C8\uB2E4", store: "\uC8FC\uC2DD\uD68C\uC0AC \uB364\uBCA8\uC774", equip: "\uD0A4\uC624\uC2A4\uD06C" },
  { quote: "\uBA54\uB274\uBCC4 \uB9E4\uCD9C\uC774 \uD55C\uB208\uC5D0 \uC815\uB9AC\uB3FC\uC11C \uC5B4\uB5A4 \uAC8C \uC798 \uB098\uAC00\uB294\uC9C0 \uBC14\uB85C \uBCF4\uC5EC\uC694", store: "\uD3C9\uD0DD \uBCA8\uCEE4\uD53C", equip: "\uD3EC\uC2A4\uAE30" },
  { quote: "\uB9C8\uCF13\uCC98\uB7FC \uC0C1\uD488 \uB9CE\uC740 \uACF3\uC5D0\uC11C \uBC14\uCF54\uB4DC \uC2A4\uCE94 \uBE60\uB978 \uAC8C \uC9C4\uC9DC \uD070 \uCC28\uC774\uC785\uB2C8\uB2E4", store: "\uD504\uB808\uC26C\uB9C8\uCF13", equip: "\uD3EC\uC2A4\uAE30" },
  { quote: "\uD0A4\uC624\uC2A4\uD06C \uB355\uBD84\uC5D0 \uC0C8\uBCBD \uBB34\uC778 \uC601\uC5C5\uC774 \uAC00\uB2A5\uD574\uC838\uC11C \uC778\uAC74\uBE44 \uBD80\uB2F4\uC774 \uD06C\uAC8C \uC904\uC5C8\uC5B4\uC694", store: "\uD638\uBC18", equip: "\uD0A4\uC624\uC2A4\uD06C" },
  { quote: "\uBA54\uB274 \uCD94\uAC00\uB3C4 \uC27D\uACE0 \uC601\uC218\uC99D\uB3C4 \uBE60\uB974\uAC8C \uB098\uC640\uC11C \uBC14\uC05C \uC2DC\uAC04\uC5D0 \uC9C4\uAC00\uAC00 \uBCF4\uC785\uB2C8\uB2E4", store: "\uB2E4\uB77C\uC774\uD3EC\uCC28", equip: "\uD3EC\uC2A4\uAE30" },
  { quote: "\uC124\uCE58 \uD6C4\uC5D0 \uC0AC\uC18C\uD55C \uAC70 \uBB3C\uC5B4\uBD10\uB3C4 \uCE5C\uC808\uD558\uAC8C \uB2F5\uD574\uC8FC\uC154\uC11C \uBBFF\uC74C\uC774 \uAC11\uB2C8\uB2E4", store: "\uBCA0\uBCA0\uC2A4\uD154\uB77C", equip: "\uD3EC\uC2A4\uAE30" }
];
var InstallReviews = () => /* @__PURE__ */ jsxDEV("section", { class: "install-reviews", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "REAL VOICES" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      "\uC124\uCE58 \uB9E4\uC7A5 ",
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uD55C \uC904 \uD6C4\uAE30." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC704 \uB9E4\uC7A5 \uC0AC\uC7A5\uB2D8\uB4E4\uC774 \uC9C1\uC811 \uB0A8\uAE30\uC2E0 \uD55C\uB9C8\uB514." })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "reviews-stage", children: /* @__PURE__ */ jsxDEV("div", { class: "reviews-track", children: [
    installReviews.map((r) => /* @__PURE__ */ jsxDEV("div", { class: "review-row", children: [
      /* @__PURE__ */ jsxDEV("span", { class: "review-quote", children: r.quote }),
      /* @__PURE__ */ jsxDEV("span", { class: "review-meta", children: [
        r.store,
        " \xB7 ",
        r.equip
      ] })
    ] })),
    installReviews.map((r) => /* @__PURE__ */ jsxDEV("div", { class: "review-row", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxDEV("span", { class: "review-quote", children: r.quote }),
      /* @__PURE__ */ jsxDEV("span", { class: "review-meta", children: [
        r.store,
        " \xB7 ",
        r.equip
      ] })
    ] }))
  ] }) })
] });

// src/components/sections/WhyUs.tsx
var reasons = [
  {
    num: "01",
    title: "\uD55C \uBC88\uC5D0 \uBAA8\uB450 \uC124\uCE58",
    desc: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30\xB7\uD3EC\uC2A4\uAE30\xB7\uD0A4\uC624\uC2A4\uD06C\uBD80\uD130 \uC778\uD130\uB137\xB7CCTV\xB7\uC778\uD14C\uB9AC\uC5B4\uAE4C\uC9C0. \uC5EC\uB7EC \uC5C5\uCCB4 \uC548 \uAC70\uCE58\uACE0 \uD55C \uACF3\uC5D0\uC11C \uB05D\uB0C5\uB2C8\uB2E4.",
    metric: "9\uC885",
    metricLabel: "\uCDE8\uAE09 \uC7A5\uBE44"
  },
  {
    num: "02",
    title: "\uC804\uAD6D 17\uAC1C \uC2DC\xB7\uB3C4 \uCD9C\uC7A5",
    desc: "\uBCF8\uC0AC \uC9C1\uC6D0 \uB610\uB294 \uC9C0\uC5ED \uC804\uB2F4 \uB9E4\uB2C8\uC800\uAC00 \uC9C1\uC811 \uBC29\uBB38 \uC124\uCE58. \uBCC4\uB3C4 \uCD9C\uC7A5\uBE44 \uC5C6\uC774 \uACAC\uC801 \uADF8\uB300\uB85C.",
    metric: "17\uAC1C",
    metricLabel: "\uC2DC\xB7\uB3C4 \uCEE4\uBC84"
  },
  {
    num: "03",
    title: "VAN\uC0AC\xB7\uD1B5\uC2E0\uC0AC \uBE44\uAD50 \uACAC\uC801",
    desc: "\uCE74\uB4DC VAN\uC0AC\xB7\uC778\uD130\uB137 \uD1B5\uC2E0\uC0AC \uC218\uC218\uB8CC\uB97C \uC9C1\uC811 \uBE44\uAD50\uD574 \uAC00\uC7A5 \uC720\uB9AC\uD55C \uC870\uAC74\uC73C\uB85C \uC548\uB0B4\uD569\uB2C8\uB2E4.",
    metric: "5+",
    metricLabel: "VAN\uC0AC \uBE44\uAD50"
  },
  {
    num: "04",
    title: "\uC124\uCE58 \uD6C4\uC5D0\uB3C4 \uC5F0\uB77D\uBC1B\uC2B5\uB2C8\uB2E4",
    desc: "\uC124\uCE58 \uD6C4 \uBC1C\uC0DD\uD558\uB294 \uBB38\uC758\xB7AS \uC694\uCCAD\uC5D0 365\uC77C \uC0C1\uB2F4 \uAC00\uB2A5. \uC6D0\uACA9 \uC9C0\uC6D0\uACFC \uCD9C\uC7A5 AS \uBAA8\uB450 \uC6B4\uC601\uD569\uB2C8\uB2E4.",
    metric: "365\uC77C",
    metricLabel: "\uC0C1\uB2F4 \uAC00\uB2A5"
  }
];
var WhyUs = () => /* @__PURE__ */ jsxDEV("section", { class: "why-us", id: "why-us", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "why-head", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "WHY US" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      "\uC774\uB7F0 \uBD80\uBD84\uC774 ",
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uB2E4\uB985\uB2C8\uB2E4." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uB2E8\uB9D0\uAE30\uB9CC \uD30C\uB294 \uACF3\uC774 \uC544\uB2C8\uB77C, \uB9E4\uC7A5 \uD558\uB098 \uCC28\uB9AC\uB294\uB370 \uD544\uC694\uD55C \uAC78 \uC804\uBD80 \uCC45\uC784\uC9D1\uB2C8\uB2E4." })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "why-grid", children: reasons.map((r) => /* @__PURE__ */ jsxDEV("div", { class: "why-card", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "why-num", children: r.num }),
    /* @__PURE__ */ jsxDEV("h3", { class: "why-title", children: r.title }),
    /* @__PURE__ */ jsxDEV("p", { class: "why-desc", children: r.desc }),
    /* @__PURE__ */ jsxDEV("div", { class: "why-metric", children: [
      /* @__PURE__ */ jsxDEV("span", { class: "why-metric-num", children: r.metric }),
      /* @__PURE__ */ jsxDEV("span", { class: "why-metric-label", children: r.metricLabel })
    ] })
  ] })) })
] }) });

// src/components/sections/MidCTA.tsx
var MidCTA = () => /* @__PURE__ */ jsxDEV("section", { class: "mid-cta", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("div", { class: "mid-cta-inner", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "mid-cta-text", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "mid-cta-title", children: "\uC6B0\uB9AC \uB9E4\uC7A5\uC5D4 \uC5B4\uB5A4 \uC7A5\uBE44\uAC00 \uD544\uC694\uD560\uAE4C?" }),
    /* @__PURE__ */ jsxDEV("p", { class: "mid-cta-sub", children: "\uC5C5\uC885\uACFC \uB9E4\uC7A5 \uADDC\uBAA8\uB9CC \uB9D0\uC500\uD574 \uC8FC\uC2DC\uBA74, 1\uBD84 \uC548\uC5D0 \uB9DE\uCDA4 \uAD6C\uC131\uC744 \uCD94\uCC9C\uD574 \uB4DC\uB9BD\uB2C8\uB2E4. \uACAC\uC801\uC740 \uBB34\uB8CC\uC785\uB2C8\uB2E4." })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "mid-cta-actions", children: /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "mid-cta-phone", children: [
    /* @__PURE__ */ jsxDEV("span", { class: "mid-cta-phone-label", children: "\uC804\uD654 \uC0C1\uB2F4" }),
    /* @__PURE__ */ jsxDEV("span", { class: "mid-cta-phone-num", children: "010-9677-2356" })
  ] }) })
] }) }) });

// src/data/industries.ts
var industries = [
  {
    slug: "\uC2DD\uB2F9",
    category: "food",
    name: "\uC2DD\uB2F9\xB7\uC74C\uC2DD\uC810",
    icon: "\u{1F35A}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30 \xB7 \uC624\uB354",
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uBC14\uC05C \uC2DD\uB2F9 \uC6B4\uC601\uC5D0 \uCD5C\uC801\uD654\uB41C \uD1B5\uD569 \uD328\uD0A4\uC9C0.",
    commonIssues: ["\uD53C\uD06C \uD0C0\uC784 \uACB0\uC81C \uB300\uAE30", "\uC8FC\uBB38 \uC2E4\uC218", "\uC7AC\uACE0 \uAD00\uB9AC"],
    marketStats: {
      stat1: { value: "15\uB9CC+", label: "\uC804\uAD6D \uC77C\uBC18\uC74C\uC2DD\uC810", sub: "\uC2DD\uD488\uC758\uC57D\uD488\uC548\uC804\uCC98 2026" },
      stat2: { value: "76%", label: "POS \uB3C4\uC785\uB960", sub: "5\uC778 \uC774\uC0C1 \uB9E4\uC7A5 \uAE30\uC900" },
      stat3: { value: "2.3\uC870", label: "\uC5F0\uAC04 POS \uC2DC\uC7A5\uADDC\uBAA8", sub: "\uAD6D\uB0B4 \uC678\uC2DD\uC5C5 \uAE30\uC900" }
    },
    installRecord: {
      totalCount: "1,280",
      recentMonthCount: "98",
      popularSetup: "\uD3EC\uC2A4\uAE30 + \uCE74\uB4DC\uB2E8\uB9D0\uAE30"
    },
    successTips: [
      { number: "01", title: "\uD53C\uD06C\uD0C0\uC784 \uACB0\uC81C \uBCD1\uBAA9 \uD574\uACB0", desc: "\uC810\uC2EC\xB7\uC800\uB141 \uB7EC\uC2DC \uD0C0\uC784\uC5D0 \uACB0\uC81C \uB300\uAE30\uAC00 \uB9E4\uCD9C \uC190\uC2E4\uB85C \uC774\uC5B4\uC9D1\uB2C8\uB2E4. \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \uC678\uC5D0 \uBB34\uC120 \uB2E8\uB9D0\uAE30\uB97C \uCD94\uAC00\uB85C \uAD6C\uBE44\uD558\uBA74 \uD68C\uC804\uC728\uC774 \uD06C\uAC8C \uC0C1\uC2B9\uD569\uB2C8\uB2E4." },
      { number: "02", title: "\uC8FC\uBC29-\uD640 \uC2E4\uC2DC\uAC04 \uC8FC\uBB38 \uC5F0\uB3D9", desc: "POS\uC5D0\uC11C \uC8FC\uBC29 \uD504\uB9B0\uD130\uB85C \uC790\uB3D9 \uC804\uB2EC\uB418\uB3C4\uB85D \uC5F0\uB3D9\uD558\uBA74 \uC8FC\uBB38 \uB204\uB77D\xB7\uC804\uB2EC \uC624\uB958\uAC00 70% \uC774\uC0C1 \uC904\uC5B4\uB4ED\uB2C8\uB2E4." },
      { number: "03", title: "\uB9E4\uCD9C \uB370\uC774\uD130\uB85C \uBA54\uB274 \uCD5C\uC801\uD654", desc: "\uC2DC\uAC04\uB300\xB7\uC694\uC77C\uBCC4 \uB9E4\uCD9C \uB370\uC774\uD130\uB97C \uBD84\uC11D\uD574 \uC778\uAE30 \uBA54\uB274 \uC911\uC2EC\uC73C\uB85C \uC7AC\uAD6C\uC131\uD558\uBA74 \uC6D0\uAC00\uC728 3~5% \uAC1C\uC120 \uAC00\uB2A5." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "1\uC778 \uC6B4\uC601 \xB7 10\uD3C9 \uC774\uD558",
        items: ["\uBBF8\uB2C8 POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "VAN \uC5F0\uB3D9"],
        initialCost: "30\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 2.5\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "20~30\uD3C9 \xB7 \uD640 \uC6B4\uC601",
        popular: true,
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130", "VAN \uC5F0\uB3D9"],
        initialCost: "60\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "40\uD3C9 \uC774\uC0C1 \xB7 \uD14C\uC774\uBE14\uC624\uB354",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uD14C\uC774\uBE14\uC624\uB354 6\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130 2\uB300"],
        initialCost: "180\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 9\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uBB34\uC870\uAC74 \uC2FC \uB2E8\uB9D0\uAE30 \uC120\uD0DD", desc: "\uCD08\uAE30 \uBE44\uC6A9\uB9CC \uBCF4\uACE0 \uACB0\uC815\uD558\uBA74 AS \uC9C0\uC6D0\uC774 \uBBF8\uBE44\uD558\uAC70\uB098 \uC57D\uC815 \uC704\uC57D\uAE08\uC774 \uD070 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uCD1D \uC18C\uC720 \uBE44\uC6A9(TCO) \uAD00\uC810\uC5D0\uC11C \uD310\uB2E8\uD558\uC138\uC694." },
      { title: "\uC8FC\uBC29 \uD504\uB9B0\uD130 \uC5F0\uB3D9 \uD655\uC778 \uC5C6\uC774 \uAD6C\uB9E4", desc: "\uD640-\uC8FC\uBC29 \uC8FC\uBB38 \uC804\uB2EC\uC774 \uC548 \uB418\uBA74 \uD53C\uD06C\uD0C0\uC784 \uB300\uD63C\uB780. \uACC4\uC57D \uC804 \uD504\uB9B0\uD130 \uC5F0\uB3D9 \uAC00\uB2A5 \uC5EC\uBD80\uB97C \uBC18\uB4DC\uC2DC \uD655\uC778\uD558\uC138\uC694." },
      { title: "\uD14C\uC774\uBE14\uC624\uB354 \uC5C6\uC774 \uD640 \uC6B4\uC601", desc: "20\uD14C\uC774\uBE14 \uC774\uC0C1 \uC911\xB7\uB300\uD615 \uB9E4\uC7A5\uC740 \uD14C\uC774\uBE14\uC624\uB354\uAC00 \uC788\uC73C\uBA74 \uC778\uAC74\uBE44 \uC808\uAC10\uACFC \uD68C\uC804\uC728 \uD5A5\uC0C1 \uD6A8\uACFC\uAC00 \uD07D\uB2C8\uB2E4. \uC88C\uC11D \uD68C\uC804\uC774 \uBE60\uB978 \uC5C5\uC885\uC77C\uC218\uB85D ROI\uAC00 \uBE60\uB985\uB2C8\uB2E4." }
    ],
    faq: [
      { q: "\uC2DD\uB2F9 \uD3EC\uC2A4\uAE30\uB294 \uC5B4\uB5A4 \uAC78 \uC120\uD0DD\uD574\uC57C \uD558\uB098\uC694?", a: "\uC2DD\uB2F9\uC740 \uD3EC\uC2A4\uAE30 + \uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300\uAC00 \uAE30\uBCF8 \uAD6C\uC131\uC785\uB2C8\uB2E4. \uB9E4\uC7A5 \uADDC\uBAA8\uC640 \uC6B4\uC601 \uBC29\uC2DD(\uBC30\uB2EC \uC720\uBB34, \uD14C\uC774\uBE14 \uC218)\uC5D0 \uB530\uB77C \uC8FC\uBC29 \uD504\uB9B0\uD130\xB7\uD14C\uC774\uBE14\uC624\uB354 \uB4F1\uC744 \uCD94\uAC00\uD560 \uC218 \uC788\uC73C\uB2C8 \uBB34\uB8CC \uC0C1\uB2F4\uC744 \uC774\uC6A9\uD574\uBCF4\uC138\uC694." },
      { q: "\uBC30\uB2EC\uC571\uACFC POS\uB97C \uC5F0\uB3D9\uD560 \uC218 \uC788\uB098\uC694?", a: "\uAC00\uB2A5\uD569\uB2C8\uB2E4. \uBC30\uBBFC\xB7\uCFE0\uD321\uC774\uCE20\xB7\uC694\uAE30\uC694 3\uC0AC \uC8FC\uBB38\uC774 POS\uC5D0 \uC790\uB3D9 \uC804\uB2EC\uB418\uC5B4 \uC218\uAE30 \uC785\uB825 \uC5C6\uC774 \uC8FC\uBC29 \uD504\uB9B0\uD130\uB85C \uCD9C\uB825\uB429\uB2C8\uB2E4. \uBC30\uB2EC \uC804\uC6A9 POS \uBAA8\uB378\uC744 \uC120\uD0DD\uD558\uC2DC\uBA74 \uB429\uB2C8\uB2E4." },
      { q: "\uD14C\uC774\uBE14\uC624\uB354\uB294 \uAF2D \uC124\uCE58\uD574\uC57C \uD558\uB098\uC694?", a: "\uD544\uC218\uB294 \uC544\uB2C8\uC9C0\uB9CC 20\uD14C\uC774\uBE14 \uC774\uC0C1 \uC911\xB7\uB300\uD615 \uC2DD\uB2F9\uC5D0\uC11C\uB294 \uC778\uAC74\uBE44 \uC808\uAC10\uACFC \uD68C\uC804\uC728 \uD5A5\uC0C1 \uD6A8\uACFC\uAC00 \uD07D\uB2C8\uB2E4. \uC88C\uC11D \uD68C\uC804\uC774 \uBE60\uB978 \uC5C5\uC885\uC77C\uC218\uB85D ROI\uAC00 \uBE60\uB985\uB2C8\uB2E4." },
      { q: "\uCD08\uAE30 \uBE44\uC6A9 \uC5C6\uC774 \uC124\uCE58 \uAC00\uB2A5\uD55C\uAC00\uC694?", a: "\uB80C\uD0C8\xB7\uB9AC\uC2A4 \uBC29\uC2DD\uC73C\uB85C \uCD08\uAE30 \uBE44\uC6A9 \uC5C6\uC774 \uC6D4 \uC774\uC6A9\uB8CC\uB9CC \uB0B4\uB294 \uAD6C\uC870\uB3C4 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uC57D\uC815 \uAE30\uAC04\uC774 \uAE38\uC5B4\uC9C8 \uC218 \uC788\uC73C\uB2C8 \uCD1D \uBE44\uC6A9\uC744 \uBE44\uAD50\uD574 \uC120\uD0DD\uD558\uC138\uC694." },
      { q: "\uC124\uCE58 \uD6C4 \uBB38\uC81C \uBC1C\uC0DD \uC2DC AS\uB294 \uC5B4\uB5BB\uAC8C \uC9C4\uD589\uB418\uB098\uC694?", a: "\uC804\uAD6D \uCD9C\uC7A5 AS \uB124\uD2B8\uC6CC\uD06C\uB97C \uD1B5\uD574 \uC77C\uC815 \uC870\uC728 \uD6C4 \uBC29\uBB38 AS\uAC00 \uC9C4\uD589\uB429\uB2C8\uB2E4. POS \uC18C\uD504\uD2B8\uC6E8\uC5B4 \uC624\uB958 \uB4F1 \uB2E8\uC21C \uC774\uC288\uB294 \uC6D0\uACA9 \uC9C0\uC6D0\uC73C\uB85C \uC989\uC2DC \uD574\uACB0 \uAC00\uB2A5\uD569\uB2C8\uB2E4." }
    ]
  },
  {
    slug: "\uCE74\uD398",
    category: "cafe",
    name: "\uCE74\uD398",
    icon: "\u2615",
    meta: "\uD0A4\uC624\uC2A4\uD06C \xB7 POS \xB7 \uBCA8",
    recommendedProducts: ["\uD0A4\uC624\uC2A4\uD06C", "\uD3EC\uC2A4\uAE30"],
    description: "\uC18C\uD615\xB7\uAC1C\uC778 \uCE74\uD398\uBD80\uD130 \uD504\uB79C\uCC28\uC774\uC988\uAE4C\uC9C0.",
    commonIssues: ["\uD53C\uD06C \uD0C0\uC784 \uC904\uC11C\uAE30", "\uD640 \uC778\uAC74\uBE44", "\uC8FC\uBB38 \uC2E4\uC218"],
    marketStats: {
      stat1: { value: "10\uB9CC+", label: "\uC804\uAD6D \uCEE4\uD53C\uC804\uBB38\uC810", sub: "\uAD6D\uC138\uCCAD 2026 \uD1B5\uACC4" },
      stat2: { value: "45%", label: "\uD0A4\uC624\uC2A4\uD06C \uB3C4\uC785\uB960", sub: "\uCD5C\uADFC 3\uB144 4\uBC30 \uC99D\uAC00" },
      stat3: { value: "9.2\uC870", label: "\uC5F0\uAC04 \uCEE4\uD53C\uC2DC\uC7A5", sub: "\uC18C\uB9E4\xB7\uC720\uD1B5 \uD3EC\uD568" }
    },
    installRecord: {
      totalCount: "2,140",
      recentMonthCount: "156",
      popularSetup: "\uD0A4\uC624\uC2A4\uD06C + \uD3EC\uC2A4\uAE30"
    },
    successTips: [
      { number: "01", title: "\uD0A4\uC624\uC2A4\uD06C\uB85C \uC778\uAC74\uBE44 \uC808\uAC10", desc: "\uC624\uC804 \uD53C\uD06C(7~10\uC2DC)\uC5D0 \uD0A4\uC624\uC2A4\uD06C 1\uB300 \uB3C4\uC785 \uC2DC \uD640 \uC9C1\uC6D0 1\uBA85\uBD84 \uC778\uAC74\uBE44 \uC808\uAC10 \uD6A8\uACFC. \uD22C\uC790 \uD68C\uC218 \uD3C9\uADE0 6\uAC1C\uC6D4." },
      { number: "02", title: "\uC9C4\uB3D9\uBCA8\xB7\uC624\uB354\uBCA8 \uB3C4\uC785", desc: "\uC190\uB2D8\uC774 \uC790\uB9AC\uC5D0 \uC549\uC544\uC11C \uAE30\uB2E4\uB9B4 \uC218 \uC788\uC5B4 \uB9E4\uC7A5 \uD63C\uC7A1\uB3C4\uAC00 \uB0AE\uC544\uC9C0\uACE0, \uC74C\uB8CC \uD53D\uC5C5 \uC2E4\uC218\uAC00 \uC904\uC5B4\uB4ED\uB2C8\uB2E4." },
      { number: "03", title: "\uB2E8\uACE8 \uACE0\uAC1D \uBA64\uBC84\uC2ED \uC6B4\uC601", desc: "POS\uC5D0 \uBA64\uBC84\uC2ED \uAE30\uB2A5 \uC5F0\uB3D9 \uC2DC \uC7AC\uBC29\uBB38\uC728 \uD3C9\uADE0 38% \uC0C1\uC2B9. \uC0DD\uC77C\xB7\uCFE0\uD3F0 \uBC1C\uC1A1\uC73C\uB85C \uC6D4 \uB9E4\uCD9C \uAFB8\uC900\uD788 \uAD00\uB9AC." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "1\uC778 \uC6B4\uC601 \xB7 \uC18C\uD615",
        items: ["\uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC9C4\uB3D9\uBCA8 4\uAC1C"],
        initialCost: "80\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "\uD14C\uC774\uD06C\uC544\uC6C3 + \uD640 \uC6B4\uC601",
        popular: true,
        items: ["\uD0A4\uC624\uC2A4\uD06C 1\uB300", "\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC9C4\uB3D9\uBCA8 10\uAC1C"],
        initialCost: "150\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "\uD504\uB79C\uCC28\uC774\uC988 \xB7 \uB300\uD615",
        items: ["\uD0A4\uC624\uC2A4\uD06C 2\uB300", "\uD3EC\uC2A4\uAE30 2\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 2\uB300", "\uC9C4\uB3D9\uBCA8 20\uAC1C", "\uD14C\uC774\uBE14\uC624\uB354"],
        initialCost: "350\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 10\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uD0A4\uC624\uC2A4\uD06C \uB2E8\uB3C5 \uC6B4\uC601", desc: "\uB178\uB144\uCE35\xB7\uB2E8\uACE8 \uACE0\uAC1D \uB300\uC751\uC744 \uC704\uD574 \uC9C1\uC6D0 \uACB0\uC81C \uCC3D\uAD6C\uB3C4 \uCD5C\uC18C 1\uAC1C\uB294 \uC720\uC9C0\uD558\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4. \uD0A4\uC624\uC2A4\uD06C \uC624\uB958 \uC2DC \uB300\uCCB4 \uC218\uB2E8\uC774 \uC5C6\uC73C\uBA74 \uB9E4\uCD9C \uC190\uC2E4." },
      { title: "\uC9C4\uB3D9\uBCA8 \uAC1C\uC218 \uBD80\uC871", desc: "\uC88C\uC11D \uC218\uBCF4\uB2E4 \uC9C4\uB3D9\uBCA8\uC774 \uC801\uC73C\uBA74 \uD53D\uC5C5 \uD63C\uC120\uC774 \uC0DD\uAE41\uB2C8\uB2E4. \uCD5C\uB300 \uC88C\uC11D \uC218\uC758 1.2\uBC30 \uC774\uC0C1 \uAD8C\uC7A5." },
      { title: "POS\uC640 \uD0A4\uC624\uC2A4\uD06C \uB530\uB85C \uC0AC\uC6A9", desc: "\uBCC4\uB3C4 \uC2DC\uC2A4\uD15C \uC6B4\uC601 \uC2DC \uB9E4\uCD9C \uD1B5\uD569 \uC9D1\uACC4\uAC00 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uCC98\uC74C\uBD80\uD130 POS\xB7\uD0A4\uC624\uC2A4\uD06C \uC5F0\uB3D9\uD615\uC73C\uB85C \uAD6C\uC131\uD558\uC138\uC694." }
    ],
    faq: [
      { q: "\uC18C\uD615 \uCE74\uD398\uC5D0\uB3C4 \uD0A4\uC624\uC2A4\uD06C \uC124\uCE58\uAC00 \uAC00\uB2A5\uD55C\uAC00\uC694?", a: "\uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C(\uB108\uBE44 40cm \uC774\uD558) \uBAA8\uB378\uB85C \uC881\uC740 \uACF5\uAC04\uC5D0\uB3C4 \uC124\uCE58 \uAC00\uB2A5\uD569\uB2C8\uB2E4. 1\uD3C9 \uC774\uD558 \uACF5\uAC04\uC5D0\uB3C4 \uBCBD\uBA74 \uBD80\uCC29\uD615\uC73C\uB85C \uD574\uACB0\uB429\uB2C8\uB2E4." },
      { q: "\uCE74\uD398\uC6A9 POS\uC640 \uC77C\uBC18 POS \uCC28\uC774\uB294 \uBB34\uC5C7\uC778\uAC00\uC694?", a: "\uCE74\uD398\uC6A9\uC740 \uC74C\uB8CC \uC635\uC158(\uC0AC\uC774\uC988\xB7\uC0F7\xB7\uC5BC\uC74C\xB7\uC2DC\uB7FD) \uC120\uD0DD UI\uAC00 \uCD5C\uC801\uD654\uB418\uC5B4 \uC788\uACE0, \uBA64\uBC84\uC2ED\xB7\uCFE0\uD3F0 \uAE30\uB2A5\uC774 \uAE30\uBCF8 \uD0D1\uC7AC\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." },
      { q: "\uC2A4\uD0C0\uBC85\uC2A4\uCC98\uB7FC \uC8FC\uBB38 \uC9C4\uD589 \uC0C1\uD669\uC744 \uBCF4\uC5EC\uC904 \uC218 \uC788\uB098\uC694?", a: "\uB124, \uC8FC\uBB38\uD604\uD669\uD310 \uBAA8\uB2C8\uD130\uB97C \uCD94\uAC00\uD558\uBA74 \uC190\uB2D8\uC774 \uC790\uAE30 \uC8FC\uBB38\uC758 \uC81C\uC870 \uC0C1\uD0DC\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACE0\uAC1D \uB9CC\uC871\uB3C4\uC640 \uD68C\uC804\uC728\uC774 \uB3D9\uC2DC\uC5D0 \uD5A5\uC0C1\uB429\uB2C8\uB2E4." },
      { q: "\uBC30\uB2EC\uC571 \uC5F0\uB3D9\uB3C4 \uCE74\uD398\uC5D0 \uD544\uC694\uD55C\uAC00\uC694?", a: "\uD14C\uC774\uD06C\uC544\uC6C3\xB7\uBC30\uB2EC \uBE44\uC911\uC774 \uB192\uC740 \uCE74\uD398\uB294 \uD544\uC218\uC785\uB2C8\uB2E4. \uD2B9\uD788 \uC694\uAE30\uC694\xB7\uBC30\uBBFC \uCEE4\uD53C \uCE74\uD14C\uACE0\uB9AC \uB9E4\uCD9C \uBE44\uC911\uC774 30% \uC774\uC0C1\uC774\uBA74 POS \uC5F0\uB3D9\uC744 \uCD94\uCC9C\uD569\uB2C8\uB2E4." },
      { q: "\uBA64\uBC84\uC2ED\uC740 \uC5B4\uB5BB\uAC8C \uC6B4\uC601\uD558\uB098\uC694?", a: "POS\uC5D0\uC11C \uC804\uD654\uBC88\uD638 \uAE30\uBC18 \uBA64\uBC84\uC2ED \uC790\uB3D9 \uC801\uB9BD\xB7\uC0AC\uC6A9\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uCE74\uCE74\uC624 \uC54C\uB9BC\uD1A1\uC73C\uB85C \uCFE0\uD3F0 \uBC1C\uC1A1\uAE4C\uC9C0 \uC790\uB3D9\uD654 \uAC00\uB2A5\uD569\uB2C8\uB2E4." }
    ]
  },
  {
    slug: "\uBBF8\uC6A9\uC2E4",
    category: "beauty",
    name: "\uBBF8\uC6A9\uC2E4",
    icon: "\u2702\uFE0F",
    meta: "\uC608\uC57D POS \xB7 \uB2E8\uB9D0\uAE30",
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC608\uC57D\xB7\uBA64\uBC84\uC2ED\xB7\uC2DC\uC220 \uAD00\uB9AC\uB97C \uD55C\uBC88\uC5D0.",
    commonIssues: ["\uC608\uC57D \uAD00\uB9AC", "\uD68C\uC6D0\uAD8C \uCD94\uC801", "\uC218\uB0A9 \uD63C\uC120"],
    marketStats: {
      stat1: { value: "10\uB9CC+", label: "\uC804\uAD6D \uBBF8\uC6A9\uC5C5\uC18C", sub: "\uBCF4\uAC74\uBCF5\uC9C0\uBD80 2026" },
      stat2: { value: "58%", label: "\uC608\uC57D POS \uC0AC\uC6A9\uB960", sub: "\uC911\uD615 \uC774\uC0C1 \uAE30\uC900" },
      stat3: { value: "5.8\uC870", label: "\uC5F0\uAC04 \uBBF8\uC6A9\uC0B0\uC5C5", sub: "\uD5E4\uC5B4\xB7\uB124\uC77C\xB7\uBDF0\uD2F0 \uD569\uC0B0" }
    },
    installRecord: {
      totalCount: "680",
      recentMonthCount: "42",
      popularSetup: "\uC608\uC57D POS + \uCE74\uB4DC\uB2E8\uB9D0\uAE30"
    },
    successTips: [
      { number: "01", title: "\uC608\uC57D \uAD00\uB9AC \uC790\uB3D9\uD654", desc: "\uCE74\uCE74\uC624\uD1A1\xB7\uB124\uC774\uBC84 \uC608\uC57D \uC5F0\uB3D9 POS \uB3C4\uC785 \uC2DC \uC804\uD654 \uC751\uB300 \uC2DC\uAC04 60% \uAC10\uC18C. \uB178\uC1FC \uBC29\uC9C0 \uC54C\uB9BC\uB3C4 \uC790\uB3D9 \uBC1C\uC1A1." },
      { number: "02", title: "\uD68C\uC6D0\uAD8C\xB7\uCFE0\uD3F0 \uAD00\uB9AC", desc: "10+1 \uCFE0\uD3F0, \uC5FC\uC0C9 \uD68C\uC6D0\uAD8C \uB4F1\uC744 POS\uC5D0\uC11C \uAD00\uB9AC\uD558\uBA74 \uACE0\uAC1D\uBCC4 \uC774\uC6A9 \uB0B4\uC5ED\uC744 \uD55C\uB208\uC5D0 \uD30C\uC545\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." },
      { number: "03", title: "\uB514\uC790\uC774\uB108\uBCC4 \uB9E4\uCD9C \uBD84\uC11D", desc: "\uB514\uC790\uC774\uB108\uBCC4 \uB9E4\uCD9C\xB7\uC2DC\uC220 \uC2DC\uAC04\xB7\uC7AC\uBC29\uBB38\uC728\uC744 POS\uC5D0\uC11C \uCD94\uC801\uD574 \uC778\uC13C\uD2F0\uBE0C \uCCB4\uACC4\uB97C \uAC1D\uAD00\uC801\uC73C\uB85C \uC124\uACC4." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "1\uC778 \uC6D0\uC7A5 \xB7 \uC18C\uD615",
        items: ["\uBBF8\uB2C8 POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC608\uC57D SW"],
        initialCost: "40\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "\uB514\uC790\uC774\uB108 2~4\uBA85",
        popular: true,
        items: ["\uC608\uC57D POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uCE74\uCE74\uC624 \uC54C\uB9BC\uD1A1", "\uD68C\uC6D0\uAD8C \uAD00\uB9AC"],
        initialCost: "80\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "\uB514\uC790\uC774\uB108 5\uBA85 \uC774\uC0C1",
        items: ["\uC608\uC57D POS 2\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 2\uB300", "\uB514\uC790\uC774\uB108\uBCC4 \uD0DC\uBE14\uB9BF", "\uBA64\uBC84\uC2ED \uC2DC\uC2A4\uD15C"],
        initialCost: "200\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 9\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uC608\uC57D \uC2DC\uC2A4\uD15C \uBBF8\uD761", desc: "\uC218\uAE30 \uC608\uC57D\uC7A5\uB9CC \uC4F0\uBA74 \uB178\uC1FC\xB7\uC911\uBCF5 \uC608\uC57D\uC774 \uBE48\uBC88\uD569\uB2C8\uB2E4. \uCE74\uCE74\uC624\xB7\uB124\uC774\uBC84 \uC5F0\uB3D9 \uAC00\uB2A5\uD55C \uC608\uC57D POS\uB85C \uD1B5\uD569 \uAD00\uB9AC\uD558\uC138\uC694." },
      { title: "\uD68C\uC6D0\uAD8C \uAD00\uB9AC \uC18C\uD640", desc: "\uC885\uC774 \uCFE0\uD3F0\xB7\uC218\uAE30 \uC7A5\uBD80\uB294 \uBD84\uC2E4\xB7\uC624\uB958\uAC00 \uC7A6\uC2B5\uB2C8\uB2E4. POS\uC5D0 \uD68C\uC6D0\uAD8C\uC744 \uB4F1\uB85D\uD574\uB450\uBA74 \uC794\uC5EC \uD69F\uC218\uAC00 \uC790\uB3D9 \uCD94\uC801\uB429\uB2C8\uB2E4." },
      { title: "\uB514\uC790\uC774\uB108\uBCC4 \uB9E4\uCD9C \uC9D1\uACC4 \uBBF8\uD761", desc: "\uB204\uAC00 \uC5BC\uB9C8\uB97C \uB9E4\uCD9C \uB0C8\uB294\uC9C0 \uBAA8\uB974\uBA74 \uC778\uC13C\uD2F0\uBE0C \uB17C\uB780\uC774 \uC0DD\uAE41\uB2C8\uB2E4. \uB514\uC790\uC774\uB108\uBCC4 \uACB0\uC81C \uBD84\uB9AC \uAE30\uB2A5\uC774 \uC788\uB294 POS\uB97C \uC120\uD0DD\uD558\uC138\uC694." }
    ],
    faq: [
      { q: "\uBBF8\uC6A9\uC2E4 \uC804\uC6A9 \uC608\uC57D POS\uAC00 \uC788\uB098\uC694?", a: "\uB124, \uB514\uC790\uC774\uB108 \uC77C\uC815\xB7\uC2DC\uC220 \uC2DC\uAC04\xB7\uD68C\uC6D0\uAD8C \uAD00\uB9AC\uAC00 \uD1B5\uD569\uB41C \uBBF8\uC6A9\uC2E4 \uD2B9\uD654 POS\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC77C\uBC18 POS\uBCF4\uB2E4 \uC5C5\uBB34 \uD6A8\uC728\uC774 \uD06C\uAC8C \uD5A5\uC0C1\uB429\uB2C8\uB2E4." },
      { q: "\uCE74\uCE74\uC624\xB7\uB124\uC774\uBC84 \uC608\uC57D\uACFC \uC5F0\uB3D9\uB418\uB098\uC694?", a: "\uB300\uBD80\uBD84\uC758 \uBBF8\uC6A9\uC2E4 \uD2B9\uD654 POS\uB294 \uCE74\uCE74\uC624\uD1A1 \uCC44\uB110, \uB124\uC774\uBC84 \uC608\uC57D\uACFC \uC790\uB3D9 \uC5F0\uB3D9\uB429\uB2C8\uB2E4. \uC218\uAE30 \uC785\uB825 \uC5C6\uC774 \uC608\uC57D\uC774 POS\uC5D0 \uBC18\uC601\uB429\uB2C8\uB2E4." },
      { q: "\uD68C\uC6D0\uAD8C \uBC1C\uD589\xB7\uC0AC\uC6A9\uC740 \uC5B4\uB5BB\uAC8C \uAD00\uB9AC\uD558\uB098\uC694?", a: "\uACE0\uAC1D \uC815\uBCF4\uC5D0 \uD68C\uC6D0\uAD8C\uC744 \uB4F1\uB85D\uD558\uBA74 \uBC29\uBB38 \uC2DC \uC790\uB3D9 \uCC28\uAC10\uB429\uB2C8\uB2E4. \uB9CC\uB8CC\uC77C\xB7\uC794\uC5EC \uD69F\uC218\uAC00 \uCE74\uCE74\uC624\uD1A1\uC73C\uB85C \uC790\uB3D9 \uC54C\uB9BC \uBC1C\uC1A1\uB429\uB2C8\uB2E4." },
      { q: "\uB514\uC790\uC774\uB108\uBCC4 \uB9E4\uCD9C\xB7\uC778\uC13C\uD2F0\uBE0C \uACC4\uC0B0\uC774 \uB418\uB098\uC694?", a: "\uACB0\uC81C \uC2DC \uB2F4\uB2F9 \uB514\uC790\uC774\uB108\uB97C \uC120\uD0DD\uD558\uBA74 \uAC1C\uC778\uBCC4 \uB9E4\uCD9C\uC774 \uC790\uB3D9 \uC9D1\uACC4\uB429\uB2C8\uB2E4. \uC6D4\uB9D0 \uC778\uC13C\uD2F0\uBE0C \uACC4\uC0B0\uB3C4 \uC790\uB3D9\uC73C\uB85C \uCC98\uB9AC\uB429\uB2C8\uB2E4." },
      { q: "\uB178\uC1FC(\uC608\uC57D \uBD88\uC774\uD589) \uBC29\uC9C0 \uAE30\uB2A5\uC774 \uC788\uB098\uC694?", a: "\uC608\uC57D \uD655\uC815 \uD6C4 1\uC77C \uC804, 2\uC2DC\uAC04 \uC804 \uC790\uB3D9 \uC54C\uB9BC \uBC1C\uC1A1 \uAE30\uB2A5\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB178\uC1FC \uC774\uB825 \uC788\uB294 \uACE0\uAC1D \uC790\uB3D9 \uD45C\uC2DC \uAE30\uB2A5\uB3C4 \uC774\uC6A9 \uAC00\uB2A5\uD569\uB2C8\uB2E4." }
    ]
  },
  {
    slug: "\uBD84\uC2DD\uC9D1",
    category: "food",
    name: "\uBD84\uC2DD\uC9D1",
    icon: "\u{1F362}",
    meta: "\uD0A4\uC624\uC2A4\uD06C \xB7 \uBBF8\uB2C8 POS",
    recommendedProducts: ["\uD0A4\uC624\uC2A4\uD06C", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC881\uC740 \uACF5\uAC04\uC5D0\uB3C4 \uB4E4\uC5B4\uAC00\uB294 \uBBF8\uB2C8 \uAD6C\uC131.",
    commonIssues: ["\uACF5\uAC04 \uC81C\uC57D", "1\uC778 \uC6B4\uC601", "\uD68C\uC804\uC728"],
    marketStats: {
      stat1: { value: "4.5\uB9CC+", label: "\uC804\uAD6D \uBD84\uC2DD\uC810", sub: "\uAD6D\uC138\uCCAD 2026" },
      stat2: { value: "68%", label: "\uD0A4\uC624\uC2A4\uD06C \uC2E0\uADDC \uB3C4\uC785", sub: "2026\uB144 \uAE30\uC900" },
      stat3: { value: "72%", label: "1\uC778 \uC6B4\uC601 \uBE44\uC728", sub: "\uC18C\uD615 \uB9E4\uC7A5 \uAE30\uC900" }
    },
    installRecord: {
      totalCount: "520",
      recentMonthCount: "38",
      popularSetup: "\uBBF8\uB2C8\uD0A4\uC624\uC2A4\uD06C + \uCE74\uB4DC\uB2E8\uB9D0\uAE30"
    },
    successTips: [
      { number: "01", title: "\uBBF8\uB2C8\uD0A4\uC624\uC2A4\uD06C\uB85C 1\uC778 \uC6B4\uC601", desc: "\uC190\uB2D8\uC774 \uC9C1\uC811 \uC8FC\uBB38\xB7\uACB0\uC81C\uD558\uBA74 \uC870\uB9AC\uC5D0\uB9CC \uC9D1\uC911 \uAC00\uB2A5. \uBBF8\uB2C8\uD0A4\uC624\uC2A4\uD06C\uB294 \uC881\uC740 \uACF5\uAC04\uC5D0\uB3C4 \uC124\uCE58 \uAC00\uB2A5\uD569\uB2C8\uB2E4." },
      { number: "02", title: "\uD68C\uC804\uC728 \uADF9\uB300\uD654", desc: "\uC8FC\uBB38\uBD80\uD130 \uACB0\uC81C\uAE4C\uC9C0 \uD3C9\uADE0 30\uCD08 \uB2E8\uCD95. \uC810\uC2EC \uC2DC\uAC04\uB300 \uCD94\uAC00 \uC190\uB2D8 10~15\uBA85 \uC218\uC6A9 \uAC00\uB2A5." },
      { number: "03", title: "\uBA54\uB274 \uC635\uC158 \uB2E8\uC21C\uD654", desc: "\uD0A4\uC624\uC2A4\uD06C \uBA54\uB274\uB294 \uCD5C\uB300 12\uC885\uC73C\uB85C \uC81C\uD55C\uD558\uACE0 \uC635\uC158\uC744 \uB2E8\uC21C\uD654. \uC120\uD0DD \uC2DC\uAC04 \uB2E8\uCD95\uC774 \uD68C\uC804\uC728\uB85C \uC9C1\uACB0\uB429\uB2C8\uB2E4." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "5\uD3C9 \uC774\uD558 \xB7 \uD14C\uC774\uD06C\uC544\uC6C3",
        items: ["\uBBF8\uB2C8 POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "25\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 2.5\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "10\uD3C9 \uC774\uD558 \xB7 \uD640+\uD3EC\uC7A5",
        popular: true,
        items: ["\uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC601\uC218\uC99D \uD504\uB9B0\uD130"],
        initialCost: "70\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3.5\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "15\uD3C9 \uC774\uC0C1 \xB7 \uBC30\uB2EC \uACB8",
        items: ["\uD0A4\uC624\uC2A4\uD06C 1\uB300", "\uBC30\uB2EC POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130"],
        initialCost: "150\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 6\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uACF5\uAC04 \uACE0\uB824 \uC5C6\uC774 \uB300\uD615 \uD0A4\uC624\uC2A4\uD06C", desc: "\uBD84\uC2DD\uC9D1\uC740 \uACF5\uAC04\uC774 \uC881\uC2B5\uB2C8\uB2E4. \uC77C\uBC18 \uD0A4\uC624\uC2A4\uD06C \uB300\uC2E0 \uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C\uB098 \uBCBD\uBA74 \uBD80\uCC29\uD615\uC744 \uC120\uD0DD\uD558\uC138\uC694." },
      { title: "\uBA54\uB274 20\uAC1C \uC774\uC0C1 \uB4F1\uB85D", desc: "\uD0A4\uC624\uC2A4\uD06C \uBA54\uB274\uAC00 \uB108\uBB34 \uB9CE\uC73C\uBA74 \uACE0\uAC1D\uC774 \uACB0\uC815\uC744 \uBABB \uD574 \uD68C\uC804\uC728\uC774 \uC624\uD788\uB824 \uB5A8\uC5B4\uC9D1\uB2C8\uB2E4. \uC778\uAE30 12\uC885 \uC774\uB0B4\uB85C \uC81C\uD55C\uD558\uC138\uC694." },
      { title: "\uD604\uAE08 \uACB0\uC81C \uB300\uC751 \uBBF8\uD761", desc: "1\uC778 \uC6B4\uC601 \uBD84\uC2DD\uC9D1\uC5D0\uC11C \uD604\uAE08 \uACB0\uC81C \uC694\uCCAD\uC774 \uC624\uBA74 \uC870\uB9AC\uAC00 \uC911\uB2E8\uB429\uB2C8\uB2E4. \uD0A4\uC624\uC2A4\uD06C\uC5D0 \uC9C0\uD3D0 \uD22C\uC785\uAD6C\uB97C \uCD94\uAC00\uD558\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4." }
    ],
    faq: [
      { q: "\uC881\uC740 \uACF5\uAC04\uC5D0\uB3C4 \uD0A4\uC624\uC2A4\uD06C \uC124\uCE58\uAC00 \uAC00\uB2A5\uD55C\uAC00\uC694?", a: "\uB124, \uB108\uBE44 35cm\uC758 \uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C \uB610\uB294 \uBCBD\uBA74 \uBD80\uCC29\uD615\uC73C\uB85C 1\uD3C9 \uC774\uD558 \uACF5\uAC04\uC5D0\uB3C4 \uC124\uCE58 \uAC00\uB2A5\uD569\uB2C8\uB2E4." },
      { q: "1\uC778 \uC6B4\uC601\uC5D0 \uAC00\uC7A5 \uC801\uD569\uD55C \uAD6C\uC131\uC740?", a: "\uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C + \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \uC870\uD569\uC744 \uCD94\uCC9C\uD569\uB2C8\uB2E4. \uC8FC\uBB38\xB7\uACB0\uC81C\uAC00 \uC790\uB3D9\uD654\uB418\uC5B4 \uC870\uB9AC\uC5D0\uB9CC \uC9D1\uC911\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." },
      { q: "\uBC30\uB2EC\uC571\uB3C4 \uD568\uAED8 \uAD00\uB9AC\uD560 \uC218 \uC788\uB098\uC694?", a: "\uBC30\uB2EC POS\uB97C \uCD94\uAC00\uD558\uBA74 \uD0A4\uC624\uC2A4\uD06C \uC8FC\uBB38\uACFC \uBC30\uB2EC\uC571 \uC8FC\uBB38\uC774 \uD55C \uACF3\uC5D0\uC11C \uAD00\uB9AC\uB429\uB2C8\uB2E4. \uC8FC\uBC29 \uD504\uB9B0\uD130\uB85C \uC790\uB3D9 \uCD9C\uB825\uB3C4 \uAC00\uB2A5\uD569\uB2C8\uB2E4." },
      { q: "\uBA54\uB274 \uBCC0\uACBD\uC740 \uC27D\uAC8C \uD560 \uC218 \uC788\uB098\uC694?", a: "\uAD00\uB9AC\uC790 \uC571\uC5D0\uC11C \uBA54\uB274\xB7\uAC00\uACA9\xB7\uC0AC\uC9C4\uC744 \uC2E4\uC2DC\uAC04 \uBCC0\uACBD \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uACC4\uC808 \uBA54\uB274\xB7\uD55C\uC815 \uBA54\uB274 \uC6B4\uC601\uC774 \uC26C\uC6CC\uC9D1\uB2C8\uB2E4." },
      { q: "\uD604\uAE08 \uC190\uB2D8\uC774 \uB9CE\uC740\uB370 \uD0A4\uC624\uC2A4\uD06C\uB85C \uAD1C\uCC2E\uC744\uAE4C\uC694?", a: "\uC9C0\uD3D0\xB7\uB3D9\uC804 \uD22C\uC785\uC774 \uAC00\uB2A5\uD55C \uD0A4\uC624\uC2A4\uD06C \uBAA8\uB378\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uC720\uC9C0\uBCF4\uC218 \uBE44\uC6A9\uC774 \uCD94\uAC00\uB418\uB2C8 \uD604\uAE08 \uBE44\uC911\uC774 20% \uC774\uC0C1\uC77C \uB54C \uACE0\uB824\uD558\uC138\uC694." }
    ]
  },
  {
    slug: "\uCE58\uD0A8\uC9D1",
    category: "food",
    name: "\uCE58\uD0A8\uC9D1",
    icon: "\u{1F357}",
    meta: "\uBC30\uB2EC POS \xB7 \uD504\uB9B0\uD130",
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uBC30\uB2EC \uC571 \uD1B5\uD569 + \uC8FC\uBC29 \uD504\uB9B0\uD130 \uC5F0\uB3D9.",
    commonIssues: ["\uBC30\uB2EC \uC571 3\uC0AC \uD1B5\uD569", "\uC8FC\uBC29 \uC804\uB2EC", "\uB9E4\uCD9C \uD569\uC0B0"],
    marketStats: {
      stat1: { value: "3.7\uB9CC+", label: "\uC804\uAD6D \uCE58\uD0A8\uC804\uBB38\uC810", sub: "\uACF5\uC815\uAC70\uB798\uC704\uC6D0\uD68C 2026" },
      stat2: { value: "87%", label: "\uBC30\uB2EC\uC571 \uC774\uC6A9\uB960", sub: "\uBC30\uBBFC\xB7\uCFE0\uD321\xB7\uC694\uAE30\uC694 3\uC0AC" },
      stat3: { value: "9.1\uC870", label: "\uC5F0\uAC04 \uCE58\uD0A8\uC2DC\uC7A5", sub: "\uBC30\uB2EC \uB9E4\uCD9C \uD3EC\uD568" }
    },
    installRecord: {
      totalCount: "420",
      recentMonthCount: "34",
      popularSetup: "\uBC30\uB2EC POS + \uC8FC\uBC29\uD504\uB9B0\uD130"
    },
    successTips: [
      { number: "01", title: "\uBC30\uB2EC\uC571 3\uC0AC \uD1B5\uD569 \uAD00\uB9AC", desc: "\uBC30\uBBFC\xB7\uCFE0\uD321\xB7\uC694\uAE30\uC694 \uC8FC\uBB38\uC744 POS \uD55C \uB300\uC5D0\uC11C \uD1B5\uD569 \uAD00\uB9AC. \uC218\uAE30 \uC785\uB825 \uC2DC\uAC04 \uD558\uB8E8 \uD3C9\uADE0 2\uC2DC\uAC04 \uC808\uC57D." },
      { number: "02", title: "\uC8FC\uBC29 \uD504\uB9B0\uD130 \uC790\uB3D9 \uC5F0\uB3D9", desc: "\uC8FC\uBB38 \uC989\uC2DC \uC8FC\uBC29\uC73C\uB85C \uCD9C\uB825\uB418\uC5B4 \uC804\uB2EC \uB204\uB77D \uC81C\uB85C. \uD53C\uD06C \uD0C0\uC784 \uC8FC\uBB38 \uBC00\uB9BC\xB7\uB204\uB77D \uBC29\uC9C0\uC5D0 \uD544\uC218." },
      { number: "03", title: "\uB9E4\uCD9C \uD1B5\uD569 \uC815\uC0B0", desc: "\uD640\xB7\uD3EC\uC7A5\xB7\uBC30\uB2EC \uB9E4\uCD9C\uC744 POS\uC5D0\uC11C \uC790\uB3D9 \uC9D1\uACC4. \uC6D4\uB9D0 \uC815\uC0B0 \uC2DC\uAC04 \uD3C9\uADE0 5\uC2DC\uAC04 \u2192 30\uBD84\uC73C\uB85C \uB2E8\uCD95." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "\uBC30\uB2EC \uC804\uBB38 \xB7 \uC18C\uD615",
        items: ["\uBC30\uB2EC POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uBC30\uB2EC\uC571 \uC5F0\uB3D9"],
        initialCost: "50\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3.5\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "\uD640+\uBC30\uB2EC \uBCD1\uD589",
        popular: true,
        items: ["\uBC30\uB2EC POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130", "3\uC0AC \uC5F0\uB3D9"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "\uD504\uB79C\uCC28\uC774\uC988 \xB7 \uB300\uD615",
        items: ["\uBC30\uB2EC POS 2\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 2\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130 2\uB300", "\uB9E4\uCD9C \uBD84\uC11D SW"],
        initialCost: "200\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 9\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uBC30\uB2EC\uC571 \uD0DC\uBE14\uB9BF 3\uB300 \uB530\uB85C \uC0AC\uC6A9", desc: "\uBC30\uBBFC\xB7\uCFE0\uD321\xB7\uC694\uAE30\uC694\uB97C \uAC01\uAC01 \uD0DC\uBE14\uB9BF\uC73C\uB85C \uAD00\uB9AC\uD558\uBA74 \uC8FC\uBB38 \uB204\uB77D\xB7\uD63C\uC120\uC774 \uC7A6\uC2B5\uB2C8\uB2E4. \uD1B5\uD569 POS\uB85C \uD55C\uBC88\uC5D0 \uAD00\uB9AC\uD558\uC138\uC694." },
      { title: "\uC8FC\uBC29 \uD504\uB9B0\uD130 \uC5C6\uC774 \uC6B4\uC601", desc: "\uC218\uAE30\uB85C \uC8FC\uBB38\uC744 \uC804\uB2EC\uD558\uBA74 \uD53C\uD06C\uD0C0\uC784\uC5D0 \uB204\uB77D\xB7\uC624\uB958\uAC00 \uAE09\uC99D. \uC8FC\uBC29 \uD504\uB9B0\uD130 \uC5F0\uB3D9\uC740 \uCE58\uD0A8\uC9D1 \uD544\uC218 \uC7A5\uBE44\uC785\uB2C8\uB2E4." },
      { title: "\uBC30\uB2EC\uB8CC POS\uC5D0 \uBC18\uC601 \uC548 \uD568", desc: "\uBC30\uB2EC\uBE44\uB97C POS\uC5D0 \uC81C\uB300\uB85C \uBC18\uC601\uD558\uC9C0 \uC54A\uC73C\uBA74 \uC815\uC0B0 \uC2DC \uCC28\uC561\uC774 \uC0DD\uAE41\uB2C8\uB2E4. \uBC30\uB2EC\uB8CC\xB7\uD560\uC778\xB7\uCFE0\uD3F0 \uC790\uB3D9 \uACC4\uC0B0\uB418\uB294 POS\uB97C \uC120\uD0DD\uD558\uC138\uC694." }
    ],
    faq: [
      { q: "\uBC30\uB2EC\uC571 3\uC0AC\uB97C POS \uD55C \uB300\uC5D0\uC11C \uAD00\uB9AC\uD560 \uC218 \uC788\uB098\uC694?", a: "\uB124, \uD1B5\uD569 \uBC30\uB2EC POS\uB85C \uBC30\uBBFC\xB7\uCFE0\uD321\uC774\uCE20\xB7\uC694\uAE30\uC694 \uC8FC\uBB38\uC744 \uD55C \uD654\uBA74\uC5D0\uC11C \uAD00\uB9AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC218\uAE30 \uC785\uB825 \uC5C6\uC774 \uC790\uB3D9 \uC5F0\uB3D9\uB429\uB2C8\uB2E4." },
      { q: "\uC8FC\uBB38\uC774 \uB4E4\uC5B4\uC624\uBA74 \uC8FC\uBC29\uC5D0 \uC5B4\uB5BB\uAC8C \uC804\uB2EC\uB418\uB098\uC694?", a: "POS\uC5D0 \uC811\uC218\uB41C \uC8FC\uBB38\uC774 \uC8FC\uBC29 \uD504\uB9B0\uD130\uB85C \uC790\uB3D9 \uCD9C\uB825\uB429\uB2C8\uB2E4. \uD56D\uBAA9\uBCC4 \uC870\uB9AC \uC2DC\uAC04\xB7\uC6B0\uC120\uC21C\uC704\uAE4C\uC9C0 \uD45C\uC2DC\uB418\uC5B4 \uB204\uB77D \uBC29\uC9C0\uC5D0 \uD6A8\uACFC\uC801\uC785\uB2C8\uB2E4." },
      { q: "\uBC30\uB2EC\uB8CC\xB7\uCFE0\uD3F0 \uD560\uC778\uC740 \uC790\uB3D9 \uACC4\uC0B0\uB418\uB098\uC694?", a: "\uB124, \uAC01 \uBC30\uB2EC\uC571\uC758 \uC218\uC218\uB8CC\xB7\uD504\uB85C\uBAA8\uC158\xB7\uCFE0\uD3F0\uC774 \uC790\uB3D9 \uBC18\uC601\uB418\uC5B4 \uC815\uD655\uD55C \uC21C\uB9E4\uCD9C\uC774 \uACC4\uC0B0\uB429\uB2C8\uB2E4. \uC6D4\uB9D0 \uC815\uC0B0 \uC2DC \uCC28\uC561 \uAC71\uC815\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." },
      { q: "\uC804\uD654 \uC8FC\uBB38\uB3C4 \uD568\uAED8 \uAD00\uB9AC\uD560 \uC218 \uC788\uB098\uC694?", a: "\uBC1C\uC2E0\uBC88\uD638 \uD45C\uC2DC(CID) \uAE30\uB2A5\uC774 \uC788\uC5B4 \uB2E8\uACE8 \uACE0\uAC1D \uC815\uBCF4\uAC00 \uC790\uB3D9 \uD45C\uC2DC\uB429\uB2C8\uB2E4. \uC8FC\uC18C\xB7\uC8FC\uBB38 \uC774\uB825\uAE4C\uC9C0 POS\uC5D0 \uAE30\uB85D\uB429\uB2C8\uB2E4." },
      { q: "\uBC30\uB2EC \uAE30\uC0AC \uAD00\uB9AC\uB3C4 \uAC00\uB2A5\uD55C\uAC00\uC694?", a: "POS\uC5D0\uC11C \uBC30\uB2EC \uAE30\uC0AC \uBC30\uC815\xB7\uB9E4\uCD9C \uC9D1\uACC4\xB7\uC815\uC0B0\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uBD80\uB989\uC774\xB7\uBC14\uB85C\uACE0 \uB4F1 \uB300\uD589 \uC11C\uBE44\uC2A4\uC640\uB3C4 \uC5F0\uB3D9\uB429\uB2C8\uB2E4." }
    ]
  },
  {
    slug: "\uBCA0\uC774\uCEE4\uB9AC",
    category: "cafe",
    name: "\uBCA0\uC774\uCEE4\uB9AC",
    icon: "\u{1F950}",
    meta: "\uC7AC\uACE0 POS \xB7 \uB77C\uBCA8",
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC2E0\uC120 \uC7AC\uACE0 \uAD00\uB9AC + \uB77C\uBCA8 \uD504\uB9B0\uD130.",
    commonIssues: ["\uC720\uD1B5\uAE30\uD55C \uAD00\uB9AC", "\uD3D0\uAE30\uC728", "\uC6D0\uAC00 \uAD00\uB9AC"],
    marketStats: {
      stat1: { value: "2\uB9CC+", label: "\uC804\uAD6D \uC81C\uACFC\uC810", sub: "\uAD6D\uC138\uCCAD 2026" },
      stat2: { value: "25%", label: "\uD3C9\uADE0 \uD3D0\uAE30\uC728", sub: "\uC7AC\uACE0\uAD00\uB9AC \uBBF8\uD761 \uC2DC" },
      stat3: { value: "4.5\uC870", label: "\uC5F0\uAC04 \uBCA0\uC774\uCEE4\uB9AC\uC2DC\uC7A5", sub: "\uC18C\uB9E4 \uAE30\uC900" }
    },
    installRecord: {
      totalCount: "310",
      recentMonthCount: "22",
      popularSetup: "\uC7AC\uACE0 POS + \uB77C\uBCA8\uD504\uB9B0\uD130"
    },
    successTips: [
      { number: "01", title: "\uB77C\uBCA8 \uD504\uB9B0\uD130\uB85C \uC720\uD1B5\uAE30\uD55C \uAD00\uB9AC", desc: "\uC81C\uC870\uC77C\xB7\uC720\uD1B5\uAE30\uD55C \uB77C\uBCA8 \uC790\uB3D9 \uCD9C\uB825\uC73C\uB85C \uD3D0\uAE30\uC728 \uD3C9\uADE0 28% \u2192 15%\uB85C \uAC10\uC18C. \uC6D0\uAC00\uC728 \uAC1C\uC120 \uD6A8\uACFC." },
      { number: "02", title: "\uC2DC\uAC04\uB300\uBCC4 \uD310\uB9E4 \uD328\uD134 \uBD84\uC11D", desc: "\uC544\uCE68\xB7\uC624\uD6C4\xB7\uC800\uB141 \uC2DC\uAC04\uB300\uBCC4 \uC798 \uD314\uB9AC\uB294 \uD488\uBAA9\uC744 \uBD84\uC11D\uD574 \uC0DD\uC0B0\uB7C9\uC744 \uCD5C\uC801\uD654\uD558\uBA74 \uD3D0\uAE30 \uC190\uC2E4\uC744 \uD06C\uAC8C \uC904\uC785\uB2C8\uB2E4." },
      { number: "03", title: "\uC6D0\uC7AC\uB8CC \uC7AC\uACE0 \uCD94\uC801", desc: "\uBC00\uAC00\uB8E8\xB7\uBC84\uD130 \uB4F1 \uC8FC\uC694 \uC6D0\uC7AC\uB8CC \uC785\uCD9C\uACE0\uB97C POS\uC5D0\uC11C \uAD00\uB9AC. \uC608\uC0C1 \uBC1C\uC8FC\uB7C9 \uC790\uB3D9 \uACC4\uC0B0\uC73C\uB85C \uACB0\uD488 \uBC29\uC9C0." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "5\uD3C9 \uC774\uD558 \xB7 \uB2E8\uC77C \uBA54\uB274",
        items: ["\uBBF8\uB2C8 POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uAE30\uBCF8 \uB77C\uBCA8 \uD504\uB9B0\uD130"],
        initialCost: "60\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "10~20\uD3C9 \xB7 \uD488\uBAA9 \uB2E4\uC591",
        popular: true,
        items: ["\uC7AC\uACE0 POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uB77C\uBCA8 \uD504\uB9B0\uD130", "\uC7AC\uACE0 \uAD00\uB9AC SW"],
        initialCost: "120\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "\uD504\uB79C\uCC28\uC774\uC988 \xB7 \uB300\uD615",
        items: ["\uC7AC\uACE0 POS 2\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uB77C\uBCA8 \uD504\uB9B0\uD130 2\uB300", "\uC6D0\uC7AC\uB8CC \uCD94\uC801 SW"],
        initialCost: "280\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 8\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uB77C\uBCA8 \uD504\uB9B0\uD130 \uC5C6\uC774 \uC218\uAE30 \uAD00\uB9AC", desc: "\uC720\uD1B5\uAE30\uD55C\uC744 \uC218\uAE30\uB85C \uC4F0\uBA74 \uC2E4\uC218\xB7\uB204\uB77D\uC73C\uB85C \uC2DD\uC57D\uCC98 \uB2E8\uC18D \uC704\uD5D8\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uB77C\uBCA8 \uD504\uB9B0\uD130\uB85C \uC790\uB3D9 \uCD9C\uB825\uD558\uC138\uC694." },
      { title: "\uC7AC\uACE0 \uAD00\uB9AC SW \uBBF8\uC0AC\uC6A9", desc: "\uC5D1\uC140\xB7\uC218\uAE30 \uC7AC\uACE0 \uAD00\uB9AC\uB294 \uD3D0\uAE30\uC728\uC744 \uC7A1\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. POS \uC7AC\uACE0 \uAD00\uB9AC \uC5F0\uB3D9\uC73C\uB85C \uC2E4\uC2DC\uAC04 \uD30C\uC545\uC774 \uD544\uC218\uC785\uB2C8\uB2E4." },
      { title: "\uC0DD\uC0B0\uB7C9 \uAC10\uC73C\uB85C \uACB0\uC815", desc: "\uC2DC\uAC04\uB300\uBCC4 \uD310\uB9E4 \uB370\uC774\uD130 \uC5C6\uC774 \uC0DD\uC0B0\uB7C9\uC744 \uC815\uD558\uBA74 \uD3D0\uAE30 \uB610\uB294 \uD488\uC808\uC774 \uBC18\uBCF5\uB429\uB2C8\uB2E4. POS \uB370\uC774\uD130\uB85C \uADFC\uAC70 \uC788\uAC8C \uACB0\uC815\uD558\uC138\uC694." }
    ],
    faq: [
      { q: "\uB77C\uBCA8 \uD504\uB9B0\uD130\uB294 \uC5B4\uB5A4 \uAE30\uB2A5\uC774 \uC788\uB098\uC694?", a: "\uC81C\uD488\uBA85\xB7\uC81C\uC870\uC77C\xB7\uC720\uD1B5\uAE30\uD55C\xB7\uAC00\uACA9\xB7\uC131\uBD84\uC744 \uC790\uB3D9\uC73C\uB85C \uCD9C\uB825\uD569\uB2C8\uB2E4. \uC2DD\uC57D\uCC98 \uADDC\uC815\uC5D0 \uB9DE\uB294 \uB77C\uBCA8 \uC591\uC2DD\uC774 \uAE30\uBCF8 \uC81C\uACF5\uB429\uB2C8\uB2E4." },
      { q: "\uC7AC\uACE0 \uAD00\uB9AC\uB294 \uC5B4\uB5BB\uAC8C \uC774\uB8E8\uC5B4\uC9C0\uB098\uC694?", a: "\uD310\uB9E4 \uC2DC \uC7AC\uACE0\uAC00 \uC790\uB3D9 \uCC28\uAC10\uB418\uACE0, \uC548\uC804 \uC7AC\uACE0 \uBBF8\uB9CC\uC77C \uB54C \uC54C\uB9BC\uC774 \uBC1C\uC1A1\uB429\uB2C8\uB2E4. \uC77C\uBCC4\xB7\uC8FC\uBCC4\xB7\uC6D4\uBCC4 \uD310\uB9E4 \uB9AC\uD3EC\uD2B8\uB3C4 \uC790\uB3D9 \uC0DD\uC131\uB429\uB2C8\uB2E4." },
      { q: "\uC6D0\uC7AC\uB8CC \uAD00\uB9AC\uB3C4 \uAC00\uB2A5\uD55C\uAC00\uC694?", a: "\uC644\uC81C\uD488\uBFD0 \uC544\uB2C8\uB77C \uBC00\uAC00\uB8E8\xB7\uBC84\uD130\xB7\uC124\uD0D5 \uB4F1 \uC6D0\uC7AC\uB8CC\uB3C4 POS\uC5D0\uC11C \uAD00\uB9AC \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uB808\uC2DC\uD53C\uBCC4 \uC18C\uC9C4\uB7C9 \uC790\uB3D9 \uACC4\uC0B0\uC73C\uB85C \uBC1C\uC8FC \uC2DC\uC810\uC744 \uC54C\uB824\uC90D\uB2C8\uB2E4." },
      { q: "\uC720\uD1B5\uAE30\uD55C\uC774 \uC9C0\uB09C \uC81C\uD488 \uAD00\uB9AC\uB294?", a: "\uC720\uD1B5\uAE30\uD55C \uC784\uBC15 \uC2DC POS \uC54C\uB9BC\uC774 \uB739\uB2C8\uB2E4. \uD560\uC778 \uD310\uB9E4\xB7\uD3D0\uAE30 \uCC98\uB9AC\uAC00 POS\uC5D0 \uC790\uB3D9 \uAE30\uB85D\uB418\uC5B4 \uD3D0\uAE30\uC728 \uD1B5\uACC4\uAC00 \uAD00\uB9AC\uB429\uB2C8\uB2E4." },
      { q: "\uD3EC\uC7A5 \uD310\uB9E4\uC640 \uC989\uC11D \uD310\uB9E4\uB97C \uAD6C\uBD84\uD560 \uC218 \uC788\uB098\uC694?", a: "\uB124, \uD3EC\uC7A5\xB7\uB9E4\uC7A5 \uC2DD\uC0AC\xB7\uC120\uBB3C\uC6A9 \uB4F1\uC744 \uAD6C\uBD84\uD574 \uB9E4\uCD9C\uC744 \uC9D1\uACC4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC138\uAE08\uACC4\uC0B0\uC11C \uBC1C\uD589 \uC2DC\uC5D0\uB3C4 \uC720\uC6A9\uD569\uB2C8\uB2E4." }
    ]
  },
  {
    slug: "\uD53C\uD2B8\uB2C8\uC2A4",
    category: "edu",
    name: "\uD53C\uD2B8\uB2C8\uC2A4",
    icon: "\u{1F4AA}",
    meta: "\uD68C\uC6D0\uAD8C \xB7 \uCD9C\uC785",
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uD0A4\uC624\uC2A4\uD06C"],
    description: "\uD68C\uC6D0\uAD8C\xB7\uCD9C\uC785\xB7PT \uC2A4\uCF00\uC904 \uD1B5\uD569.",
    commonIssues: ["\uD68C\uC6D0\uAD8C \uAD00\uB9AC", "\uCD9C\uC785 \uD1B5\uC81C", "PT \uC608\uC57D"],
    marketStats: {
      stat1: { value: "1.2\uB9CC+", label: "\uC804\uAD6D \uD5EC\uC2A4\uC7A5", sub: "\uCCB4\uC721\uC2DC\uC124\uBC95 \uB4F1\uB85D" },
      stat2: { value: "72%", label: "\uBB34\uC778 \uCD9C\uC785 \uB3C4\uC785\uB960", sub: "\uC2E0\uADDC \uC624\uD508 \uAE30\uC900" },
      stat3: { value: "4.2\uC870", label: "\uC5F0\uAC04 \uD53C\uD2B8\uB2C8\uC2A4\uC2DC\uC7A5", sub: "\uD68C\uC6D0\uAD8C \uB9E4\uCD9C \uAE30\uC900" }
    },
    installRecord: {
      totalCount: "240",
      recentMonthCount: "18",
      popularSetup: "\uD68C\uC6D0\uAD8C POS + \uCD9C\uC785 \uD0A4\uC624\uC2A4\uD06C"
    },
    successTips: [
      { number: "01", title: "24\uC2DC\uAC04 \uBB34\uC778 \uCD9C\uC785 \uC2DC\uC2A4\uD15C", desc: "\uC9C0\uBB38\xB7\uCE74\uB4DC\xB7QR\uB85C \uBB34\uC778 \uCD9C\uC785 \uAD00\uB9AC. \uC57C\uAC04 \uC778\uAC74\uBE44 \uC81C\uB85C\uD654\uB85C \uC6D4 150\uB9CC\uC6D0 \uC774\uC0C1 \uC808\uAC10 \uAC00\uB2A5." },
      { number: "02", title: "PT \uC2A4\uCF00\uC904 \uC790\uB3D9\uD654", desc: "\uD2B8\uB808\uC774\uB108\uBCC4 \uC608\uC57D\xB7\uC218\uC5C5 \uD69F\uC218\uB97C POS\uC5D0\uC11C \uAD00\uB9AC. \uD68C\uC6D0 PT \uC794\uC5EC \uD69F\uC218 \uC54C\uB9BC\uC73C\uB85C \uC7AC\uACB0\uC81C\uC728 \uC0C1\uC2B9." },
      { number: "03", title: "\uD68C\uC6D0\uAD8C \uB9CC\uB8CC \uC790\uB3D9 \uC54C\uB9BC", desc: "\uB9CC\uB8CC 3\uC77C \uC804 \uCE74\uCE74\uC624\uD1A1 \uC790\uB3D9 \uBC1C\uC1A1\uC73C\uB85C \uC7AC\uAC00\uC785\uB960 \uD3C9\uADE0 42% \uD5A5\uC0C1. \uC2E0\uADDC \uBAA8\uC9D1 \uBD80\uB2F4 \uAC10\uC18C." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "\uC18C\uD615 \xB7 \uC8FC\uAC04 \uC6B4\uC601",
        items: ["\uD68C\uC6D0\uAD8C POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uCE74\uCE74\uC624 \uC54C\uB9BC"],
        initialCost: "80\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "24\uC2DC\uAC04 \uC6B4\uC601 \xB7 \uBB34\uC778",
        popular: true,
        items: ["\uD68C\uC6D0\uAD8C POS 1\uB300", "\uCD9C\uC785 \uD0A4\uC624\uC2A4\uD06C 1\uB300", "\uC9C0\uBB38\xB7QR \uC778\uC99D", "PT \uAD00\uB9AC"],
        initialCost: "250\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 9\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "\uD504\uB79C\uCC28\uC774\uC988 \xB7 \uB300\uD615",
        items: ["\uD68C\uC6D0\uAD8C POS 2\uB300", "\uCD9C\uC785 \uD0A4\uC624\uC2A4\uD06C 2\uB300", "PT \uD0DC\uBE14\uB9BF 5\uB300", "\uC601\uC0C1 \uCD9C\uC785 \uC2DC\uC2A4\uD15C"],
        initialCost: "600\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 15\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uC218\uAE30 \uD68C\uC6D0\uAD8C \uAD00\uB9AC", desc: "\uC5D1\uC140\xB7\uC885\uC774 \uC7A5\uBD80\uB294 \uB9CC\uB8CC\uC77C\xB7\uC794\uC5EC \uD69F\uC218 \uCD94\uC801\uC774 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. POS\uB85C \uAD00\uB9AC\uD558\uBA74 \uC790\uB3D9 \uC54C\uB9BC\xB7\uAC31\uC2E0 \uC720\uB3C4\uAC00 \uAC00\uB2A5\uD569\uB2C8\uB2E4." },
      { title: "\uCD9C\uC785 \uBCF4\uC548 \uBBF8\uD761", desc: "\uBB34\uC778 \uC6B4\uC601\uC778\uB370 CCTV\xB7\uCD9C\uC785 \uB85C\uADF8\uB9CC \uC788\uC73C\uBA74 \uC0AC\uAC74 \uBC1C\uC0DD \uC2DC \uB300\uC751\uC774 \uB2A6\uC2B5\uB2C8\uB2E4. \uCD9C\uC785 \uD0A4\uC624\uC2A4\uD06C + \uC778\uC99D \uC2DC\uC2A4\uD15C\uC744 \uBCD1\uD589\uD558\uC138\uC694." },
      { title: "PT \uC608\uC57D \uC218\uAE30 \uAD00\uB9AC", desc: "\uD2B8\uB808\uC774\uB108\uBCC4 \uC218\uC5C5\uC744 \uC218\uAE30\uB85C \uC801\uC73C\uBA74 \uC911\uBCF5 \uC608\uC57D\xB7\uB178\uC1FC\uAC00 \uC7A6\uC2B5\uB2C8\uB2E4. POS \uC5F0\uB3D9 PT \uC2A4\uCF00\uC904\uB7EC\uB85C \uC790\uB3D9\uD654\uD558\uC138\uC694." }
    ],
    faq: [
      { q: "24\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601\uC774 \uAC00\uB2A5\uD55C\uAC00\uC694?", a: "\uB124, \uCD9C\uC785 \uD0A4\uC624\uC2A4\uD06C + \uC9C0\uBB38\xB7QR\xB7\uCE74\uB4DC \uC778\uC99D \uC2DC\uC2A4\uD15C\uC73C\uB85C 24\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uC57C\uAC04 CCTV \uB179\uD654\uB3C4 \uD568\uAED8 \uAD6C\uCD95 \uAD8C\uC7A5\uB429\uB2C8\uB2E4." },
      { q: "\uD68C\uC6D0\uAD8C \uAD00\uB9AC \uC790\uB3D9\uD654\uB294 \uC5B4\uB5BB\uAC8C \uC774\uB8E8\uC5B4\uC9C0\uB098\uC694?", a: "\uB9CC\uB8CC D-30, D-7, D-1 \uC2DC\uC810\uC5D0 \uCE74\uCE74\uC624\uD1A1 \uC790\uB3D9 \uC54C\uB9BC\uC774 \uBC1C\uC1A1\uB429\uB2C8\uB2E4. \uC7AC\uB4F1\uB85D \uC720\uB3C4\uC728\uC774 \uD3C9\uADE0 42% \uD5A5\uC0C1\uB429\uB2C8\uB2E4." },
      { q: "PT \uC2A4\uCF00\uC904\uC740 \uC5B4\uB5BB\uAC8C \uAD00\uB9AC\uD558\uB098\uC694?", a: "\uD2B8\uB808\uC774\uB108\uBCC4 \uC77C\uC815\uD45C\uC5D0\uC11C \uD68C\uC6D0\uC774 \uC9C1\uC811 \uC608\uC57D \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uC794\uC5EC \uD69F\uC218\xB7\uC218\uC5C5 \uB0B4\uC5ED\uB3C4 POS\uC5D0 \uC790\uB3D9 \uAE30\uB85D\uB429\uB2C8\uB2E4." },
      { q: "\uCD9C\uC785 \uC778\uC99D \uBC29\uC2DD\uC740 \uBB34\uC5C7\uC774 \uC788\uB098\uC694?", a: "\uC9C0\uBB38\xB7\uCE74\uB4DC\xB7QR\xB7\uC5BC\uAD74 \uC778\uC99D \uC911 \uC120\uD0DD \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uAC00\uC7A5 \uB9CE\uC774 \uC4F0\uC774\uB294 \uBC29\uC2DD\uC740 \uCE74\uB4DC + QR \uC774\uC911 \uC778\uC99D\uC785\uB2C8\uB2E4." },
      { q: "\uD68C\uC6D0 \uC815\uBCF4 \uC720\uCD9C \uAC71\uC815\uC740 \uC5C6\uB098\uC694?", a: "\uD68C\uC6D0\uAD8C POS\uB294 \uAC1C\uC778\uC815\uBCF4 \uC554\uD638\uD654 \uC800\uC7A5\uC774 \uAE30\uBCF8\uC785\uB2C8\uB2E4. \uC815\uAE30 \uBC31\uC5C5\xB7\uBCF4\uC548 \uC5C5\uB370\uC774\uD2B8\uB3C4 \uBB34\uC0C1\uC73C\uB85C \uC81C\uACF5\uB429\uB2C8\uB2E4." }
    ]
  },
  {
    slug: "\uD559\uC6D0",
    category: "edu",
    name: "\uD559\uC6D0",
    icon: "\u{1F4DA}",
    meta: "\uC218\uAC15\uB8CC \xB7 \uCD9C\uACB0",
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uD0A4\uC624\uC2A4\uD06C"],
    description: "\uC218\uAC15\uB8CC\xB7\uCD9C\uACB0\xB7\uD559\uBD80\uBAA8 \uC54C\uB9BC \uC5F0\uB3D9.",
    commonIssues: ["\uC218\uAC15\uB8CC \uC218\uB0A9", "\uCD9C\uACB0 \uAD00\uB9AC", "\uD559\uBD80\uBAA8 \uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158"],
    marketStats: {
      stat1: { value: "7.8\uB9CC+", label: "\uC804\uAD6D \uD559\uC6D0", sub: "\uAD50\uC721\uD1B5\uACC4 2026" },
      stat2: { value: "53%", label: "\uCD9C\uACB0 POS \uC0AC\uC6A9\uB960", sub: "\uC911\uD615 \uC774\uC0C1 \uD559\uC6D0" },
      stat3: { value: "28\uC870", label: "\uC5F0\uAC04 \uC0AC\uAD50\uC721\uC2DC\uC7A5", sub: "\uD1B5\uACC4\uCCAD 2026" }
    },
    installRecord: {
      totalCount: "180",
      recentMonthCount: "14",
      popularSetup: "\uC218\uAC15\uB8CC POS + \uCD9C\uACB0 \uD0A4\uC624\uC2A4\uD06C"
    },
    successTips: [
      { number: "01", title: "\uD559\uBD80\uBAA8 \uC790\uB3D9 \uC54C\uB9BC", desc: "\uB4F1\xB7\uD558\uC6D0 \uC2DC\uAC01\uC744 \uD559\uBD80\uBAA8\uC5D0\uAC8C \uC2E4\uC2DC\uAC04 \uCE74\uCE74\uC624\uD1A1 \uC54C\uB9BC. \uC548\uC2EC \uC11C\uBE44\uC2A4\uB85C \uD559\uBD80\uBAA8 \uB9CC\uC871\uB3C4 \uD06C\uAC8C \uC0C1\uC2B9." },
      { number: "02", title: "\uC218\uAC15\uB8CC \uC790\uB3D9 \uCCAD\uAD6C", desc: "\uB9E4\uC6D4 \uC815\uAE30 \uCCAD\uAD6C \uC790\uB3D9\uD654\uB85C \uC218\uB0A9 \uB204\uB77D \uBC29\uC9C0. \uC5F0\uCCB4 \uC54C\uB9BC\uB3C4 \uC790\uB3D9 \uBC1C\uC1A1\uB418\uC5B4 \uC218\uB0A9\uB960 \uD3C9\uADE0 15% \uAC1C\uC120." },
      { number: "03", title: "\uCD9C\uACB0 \uB370\uC774\uD130 \uD559\uC2B5 \uBD84\uC11D", desc: "\uCD9C\uC11D\xB7\uACB0\uC11D \uD328\uD134\uACFC \uC131\uC801\uC744 \uC5F0\uB3D9 \uBD84\uC11D\uD574 \uB9DE\uCDA4 \uC0C1\uB2F4 \uC790\uB8CC\uB85C \uD65C\uC6A9. \uC7AC\uB4F1\uB85D\uB960 \uD5A5\uC0C1\uC5D0 \uAE30\uC5EC." }
    ],
    packages: [
      {
        tier: "starter",
        name: "\uC2A4\uD0C0\uD2B8\uC5C5",
        target: "\uC18C\uD615 \uAD50\uC2B5\uC18C",
        items: ["\uC218\uAC15\uB8CC POS 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uCE74\uCE74\uC624 \uC54C\uB9BC"],
        initialCost: "60\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~"
      },
      {
        tier: "standard",
        name: "\uD45C\uC900",
        target: "\uC911\uD615 \uD559\uC6D0 \xB7 \uBC18\uBCC4 \uC6B4\uC601",
        popular: true,
        items: ["\uC218\uAC15\uB8CC POS 1\uB300", "\uCD9C\uACB0 \uD0A4\uC624\uC2A4\uD06C 1\uB300", "\uCE74\uCE74\uC624 \uC54C\uB9BC\uD1A1", "\uBC18\uBCC4 \uAD00\uB9AC"],
        initialCost: "150\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 7\uB9CC\uC6D0~"
      },
      {
        tier: "premium",
        name: "\uD504\uB9AC\uBBF8\uC5C4",
        target: "\uB300\uD615 \uD559\uC6D0 \xB7 \uB2E4\uC218 \uC9C0\uC810",
        items: ["\uC218\uAC15\uB8CC POS 2\uB300", "\uCD9C\uACB0 \uD0A4\uC624\uC2A4\uD06C 2\uB300", "\uD559\uBD80\uBAA8 \uC571", "\uC131\uC801 \uAD00\uB9AC SW"],
        initialCost: "380\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 12\uB9CC\uC6D0~"
      }
    ],
    warnings: [
      { title: "\uC218\uAC15\uB8CC \uC218\uAE30 \uAD00\uB9AC", desc: "\uC885\uC774 \uC601\uC218\uC99D\xB7\uC5D1\uC140\uC740 \uC5F0\uCCB4\xB7\uB204\uB77D \uCD94\uC801\uC774 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. POS \uC790\uB3D9 \uCCAD\uAD6C\uB85C \uC218\uB0A9\uB960\uC744 15% \uC774\uC0C1 \uB192\uC774\uC138\uC694." },
      { title: "\uCD9C\uACB0 \uC218\uB3D9 \uD655\uC778", desc: '\uD559\uBD80\uBAA8\uAC00 \uAC00\uC7A5 \uAD81\uAE08\uD574\uD558\uB294 \uAC8C "\uC6B0\uB9AC \uC544\uC774 \uB3C4\uCC29\uD588\uB098"\uC785\uB2C8\uB2E4. \uD0A4\uC624\uC2A4\uD06C \uCD9C\uACB0 + \uCE74\uCE74\uC624 \uC54C\uB9BC\uC740 \uD544\uC218 \uC218\uC900.' },
      { title: "\uD559\uBD80\uBAA8 \uC18C\uD1B5 \uCC44\uB110 \uBBF8\uD761", desc: "\uC804\uD654\xB7\uBB38\uC790 \uC77C\uC77C\uC774 \uB3CC\uB9AC\uBA74 \uC5C5\uBB34 \uACFC\uBD80\uD558. \uCE74\uCE74\uC624 \uC54C\uB9BC\uD1A1 \uC77C\uAD04 \uBC1C\uC1A1 \uAE30\uB2A5\uC774 \uC788\uB294 POS\uB97C \uC120\uD0DD\uD558\uC138\uC694." }
    ],
    faq: [
      { q: "\uD559\uBD80\uBAA8 \uC54C\uB9BC\uC740 \uC5B4\uB5BB\uAC8C \uC804\uC1A1\uB418\uB098\uC694?", a: "\uB4F1\xB7\uD558\uC6D0 \uC2DC\uAC01\uC774 \uCE74\uCE74\uC624 \uC54C\uB9BC\uD1A1\uC73C\uB85C \uC2E4\uC2DC\uAC04 \uBC1C\uC1A1\uB429\uB2C8\uB2E4. \uACB0\uC11D\xB7\uC9C0\uAC01 \uC2DC\uC5D0\uB3C4 \uC989\uC2DC \uC54C\uB9BC\uC774 \uAC11\uB2C8\uB2E4." },
      { q: "\uC218\uAC15\uB8CC \uC790\uB3D9 \uCCAD\uAD6C\uB294 \uC5B4\uB5BB\uAC8C \uC774\uB8E8\uC5B4\uC9C0\uB098\uC694?", a: "\uB9E4\uC6D4 \uC815\uD574\uC9C4 \uB0A0\uC9DC\uC5D0 \uD559\uBD80\uBAA8\uC5D0\uAC8C \uCCAD\uAD6C\uC11C\uAC00 \uC790\uB3D9 \uBC1C\uC1A1\uB429\uB2C8\uB2E4. \uCE74\uB4DC\xB7\uACC4\uC88C\uC774\uCCB4\xB7\uD604\uAE08 \uBAA8\uB450 \uC9C0\uC6D0\uB418\uBA70 \uC5F0\uCCB4 \uC54C\uB9BC\uB3C4 \uC790\uB3D9\uC785\uB2C8\uB2E4." },
      { q: "\uBC18\uBCC4\xB7\uAC15\uC0AC\uBCC4 \uAD00\uB9AC\uAC00 \uAC00\uB2A5\uD55C\uAC00\uC694?", a: "\uB124, \uC218\uAC15\uC0DD\uC744 \uBC18\xB7\uAC15\uC0AC\xB7\uACFC\uBAA9\uBCC4\uB85C \uADF8\uB8F9\uD551 \uAD00\uB9AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uAC15\uC0AC\uBCC4 \uB9E4\uCD9C\xB7\uC218\uC5C5 \uC2DC\uAC04\uB3C4 \uC790\uB3D9 \uC9D1\uACC4\uB429\uB2C8\uB2E4." },
      { q: "\uCD9C\uACB0 \uBC29\uC2DD\uC740 \uBB34\uC5C7\uC774 \uC788\uB098\uC694?", a: "\uCE74\uB4DC\xB7QR\xB7\uC9C0\uBB38\xB7\uD559\uC0DD\uC99D \uC911 \uC120\uD0DD \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uC5B4\uB9B0 \uD559\uC0DD\uC740 \uCE74\uB4DC, \uC911\xB7\uACE0\uB4F1\uD559\uC0DD\uC740 QR\uC774 \uB9CE\uC774 \uC4F0\uC785\uB2C8\uB2E4." },
      { q: "\uC131\uC801 \uAD00\uB9AC\uB3C4 \uAC19\uC774 \uD560 \uC218 \uC788\uB098\uC694?", a: "\uD504\uB9AC\uBBF8\uC5C4 \uD328\uD0A4\uC9C0\uC5D0\uC11C \uC131\uC801 \uAD00\uB9AC SW\uAC00 \uD3EC\uD568\uB429\uB2C8\uB2E4. \uCD9C\uC11D\xB7\uC131\uC801\uC744 \uC5F0\uB3D9\uD574 \uD559\uBD80\uBAA8 \uC0C1\uB2F4 \uC790\uB8CC\uB85C \uD65C\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }
    ]
  },
  // ===========================================
  // 신규 16개 (간략판 - isSimple: true)
  // ===========================================
  // --- 음식점 ---
  {
    slug: "\uACE0\uAE30\uC9D1",
    name: "\uACE0\uAE30\uC9D1\xB7\uAD6C\uC774\uC804\uBB38\uC810",
    icon: "\u{1F969}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30 \xB7 \uD14C\uC774\uBE14\uC624\uB354",
    category: "food",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", "\uD14C\uC774\uBE14\uC624\uB354"],
    description: "\uD68C\uC804\uC728\uACFC \uCD94\uAC00 \uC8FC\uBB38\uC774 \uD575\uC2EC\uC778 \uACE0\uAE30\uC9D1\xB7\uAD6C\uC774 \uC804\uBB38\uC810\uC5D0 \uCD5C\uC801\uD654\uB41C \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "20~40\uD3C9 \uACE0\uAE30\uC9D1",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130 1\uB300", "\uD14C\uC774\uBE14\uC624\uB354 (\uC635\uC158)"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uD3EC\uCC28",
    name: "\uD3EC\uCC28\xB7\uC8FC\uC810",
    icon: "\u{1F376}",
    meta: "POS \xB7 \uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    category: "food",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uBC14\uC05C \uC800\uB141 \uC601\uC5C5 \uC2DC\uAC04\uC5D0 \uBE60\uB978 \uC8FC\uBB38\xB7\uACB0\uC81C\uAC00 \uD544\uC694\uD55C \uD3EC\uCC28\xB7\uC8FC\uC810\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "15~30\uD3C9 \uD3EC\uCC28\xB7\uC8FC\uC810",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130 1\uB300"],
        initialCost: "70\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 카페·디저트 ---
  {
    slug: "\uB514\uC800\uD2B8",
    name: "\uB514\uC800\uD2B8 \xB7 \uCF00\uC774\uD06C",
    icon: "\u{1F9C1}",
    meta: "\uBBF8\uB2C8 POS \xB7 \uB77C\uBCA8",
    category: "cafe",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uB514\uC800\uD2B8 \uCE74\uD398\xB7\uCF00\uC774\uD06C \uC804\uBB38\uC810\uC744 \uC704\uD55C \uAC00\uBCBC\uC6B4 \uACB0\uC81C\xB7\uC7AC\uACE0 \uAD00\uB9AC \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC18C\uD615 \uB514\uC800\uD2B8 \uB9E4\uC7A5",
        items: ["\uBBF8\uB2C8 \uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uB77C\uBCA8 \uD504\uB9B0\uD130 (\uC635\uC158)"],
        initialCost: "60\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3.5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 뷰티·패션 ---
  {
    slug: "\uB124\uC77C\uC0F5",
    name: "\uB124\uC77C\uC0F5",
    icon: "\u{1F485}",
    meta: "\uC608\uC57D POS \xB7 \uB2E8\uB9D0\uAE30",
    category: "beauty",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC608\uC57D\xB7\uACB0\uC81C\xB7\uACE0\uAC1D \uAD00\uB9AC\uAC00 \uD55C \uD654\uBA74\uC5D0\uC11C \uAC00\uB2A5\uD55C \uB124\uC77C\uC0F5\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB124\uC77C \uB514\uC790\uC774\uB108 1~3\uBA85",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uC608\uC57D SW \uD3EC\uD568)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "70\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uD53C\uBD80\uAD00\uB9AC",
    name: "\uD53C\uBD80\uAD00\uB9AC\xB7\uC5D0\uC2A4\uD14C\uD2F1",
    icon: "\u{1F486}",
    meta: "\uC608\uC57D POS \xB7 \uD68C\uC6D0\uAD8C",
    category: "beauty",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD68C\uC6D0\uAD8C\xB7\uC608\uC57D\xB7\uACB0\uC81C\uAC00 \uD55C \uBC88\uC5D0 \uAD00\uB9AC\uB418\uB294 \uD53C\uBD80\uAD00\uB9AC\uC2E4\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC5D0\uC2A4\uD14C\uD2F1 \xB7 \uD53C\uBD80\uAD00\uB9AC\uC2E4",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uD68C\uC6D0\uAD8C/\uC608\uC57D SW \uD3EC\uD568)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "80\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4.5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC637\uAC00\uAC8C",
    name: "\uC637\uAC00\uAC8C\xB7\uC758\uB958\uB9E4\uC7A5",
    icon: "\u{1F457}",
    meta: "POS \xB7 \uB77C\uBCA8 \uD504\uB9B0\uD130",
    category: "beauty",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC7AC\uACE0\xB7\uBC14\uCF54\uB4DC\xB7\uB9E4\uCD9C \uAD00\uB9AC\uAC00 \uD575\uC2EC\uC778 \uC758\uB958 \uB9E4\uC7A5\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC18C\xB7\uC911\uD615 \uC758\uB958\uB9E4\uC7A5",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uBC14\uCF54\uB4DC \uC2A4\uCE90\uB108", "\uB77C\uBCA8 \uD504\uB9B0\uD130 (\uC635\uC158)"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 판매·소매 ---
  {
    slug: "\uD3B8\uC758\uC810",
    name: "\uD3B8\uC758\uC810",
    icon: "\u{1F3EA}",
    meta: "POS \xB7 \uBC14\uCF54\uB4DC \xB7 CCTV",
    category: "retail",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", "CCTV\uC124\uCE58"],
    description: "24\uC2DC\uAC04 \uC6B4\uC601\uACFC \uB2E4\uC591\uD55C \uACB0\uC81C\uC218\uB2E8\uC774 \uD544\uC218\uC778 \uD3B8\uC758\uC810\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uD3B8\uC758\uC810 1\uC9C0\uC810",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uBC14\uCF54\uB4DC \uC2A4\uCE90\uB108", "CCTV (\uC635\uC158)"],
        initialCost: "120\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 6\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uB9C8\uD2B8",
    name: "\uB9C8\uD2B8\xB7\uC288\uD37C\uB9C8\uCF13",
    icon: "\u{1F6D2}",
    meta: "POS \xB7 \uBC14\uCF54\uB4DC \xB7 \uB77C\uBCA8",
    category: "retail",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uB300\uB7C9 \uC0C1\uD488\xB7\uBC14\uCF54\uB4DC \uCC98\uB9AC\uAC00 \uBE60\uB978 \uB9C8\uD2B8\xB7\uC288\uD37C\uB9C8\uCF13\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC18C\xB7\uC911\uD615 \uB9C8\uD2B8",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uBC14\uCF54\uB4DC \uC2A4\uCE90\uB108 2\uB300", "\uB77C\uBCA8 \uD504\uB9B0\uD130"],
        initialCost: "150\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 7\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uBB34\uC778\uB9E4\uC7A5",
    name: "\uBB34\uC778\uB9E4\uC7A5\xB7\uC140\uD504\uC2A4\uD1A0\uC5B4",
    icon: "\u{1F916}",
    meta: "\uD0A4\uC624\uC2A4\uD06C \xB7 CCTV",
    category: "retail",
    isSimple: true,
    recommendedProducts: ["\uD0A4\uC624\uC2A4\uD06C", "CCTV\uC124\uCE58"],
    description: "24\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601\uACFC \uBCF4\uC548\uC774 \uD575\uC2EC\uC778 \uBB34\uC778\uB9E4\uC7A5\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uBB34\uC778 \uC544\uC774\uC2A4\uD06C\uB9BC\xB7\uACFC\uC790\xB7\uBC00\uD0A4\uD2B8",
        items: ["\uD0A4\uC624\uC2A4\uD06C 1\uB300 (\uC140\uD504 \uACB0\uC81C)", "CCTV 4\uCC44\uB110", "\uB3C4\uC5B4\uB77D \uC5F0\uB3D9 (\uC635\uC158)"],
        initialCost: "350\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 8\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uAF43\uC9D1",
    name: "\uAF43\uC9D1\xB7\uD50C\uB77C\uC6CC\uC0F5",
    icon: "\u{1F490}",
    meta: "\uBBF8\uB2C8 POS \xB7 \uB2E8\uB9D0\uAE30",
    category: "retail",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC8FC\uBB38\xB7\uACB0\uC81C\xB7\uBC30\uC1A1 \uAD00\uB9AC\uAC00 \uAC00\uBCBC\uC6B4 \uAF43\uC9D1\xB7\uD50C\uB77C\uC6CC\uC0F5\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC18C\uD615 \uD50C\uB77C\uC6CC\uC0F5",
        items: ["\uBBF8\uB2C8 \uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "60\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3.5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 운동·교육 ---
  {
    slug: "\uD544\uB77C\uD14C\uC2A4",
    name: "\uD544\uB77C\uD14C\uC2A4\xB7\uC694\uAC00",
    icon: "\u{1F9D8}",
    meta: "\uD68C\uC6D0\uAD8C \xB7 \uC608\uC57D POS",
    category: "edu",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD68C\uC6D0\uAD8C\xB7\uC815\uAE30 \uACB0\uC81C\xB7\uC608\uC57D\uC774 \uD55C \uD654\uBA74\uC5D0 \uAD00\uB9AC\uB418\uB294 \uD544\uB77C\uD14C\uC2A4/\uC694\uAC00\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uD544\uB77C\uD14C\uC2A4\xB7\uC694\uAC00 \uC2A4\uD29C\uB514\uC624",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uD68C\uC6D0\uAD8C/\uC608\uC57D SW \uD3EC\uD568)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC2A4\uD130\uB514\uCE74\uD398",
    name: "\uC2A4\uD130\uB514\uCE74\uD398\xB7\uB3C5\uC11C\uC2E4",
    icon: "\u{1F4D6}",
    meta: "\uD0A4\uC624\uC2A4\uD06C \xB7 \uCD9C\uC785",
    category: "edu",
    isSimple: true,
    recommendedProducts: ["\uD0A4\uC624\uC2A4\uD06C", "CCTV\uC124\uCE58"],
    description: "24\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601\uACFC \uC88C\uC11D \uAD00\uB9AC\uAC00 \uD575\uC2EC\uC778 \uC2A4\uD130\uB514\uCE74\uD398\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "20~50\uC11D \uC2A4\uD130\uB514\uCE74\uD398",
        items: ["\uD0A4\uC624\uC2A4\uD06C 1\uB300 (\uC88C\uC11D/\uACB0\uC81C SW)", "CCTV 2\uCC44\uB110", "\uCD9C\uC785\uD1B5\uC81C (\uC635\uC158)"],
        initialCost: "300\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 7\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uACE8\uD504\uC5F0\uC2B5\uC7A5",
    name: "\uACE8\uD504\uC5F0\uC2B5\uC7A5\xB7\uC2A4\uD06C\uB9B0\uACE8\uD504",
    icon: "\u26F3",
    meta: "POS \xB7 \uD68C\uC6D0\uAD8C",
    category: "edu",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD0C0\uC11D\xB7\uC2DC\uAC04 \uB2E8\uC704 \uACB0\uC81C\uC640 \uD68C\uC6D0 \uAD00\uB9AC\uAC00 \uAC00\uB2A5\uD55C \uACE8\uD504\uC5F0\uC2B5\uC7A5\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC2E4\uB0B4 \uACE8\uD504\uC5F0\uC2B5\uC7A5",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uD68C\uC6D0/\uD0C0\uC11D SW)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "110\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 6\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 전문서비스 ---
  {
    slug: "\uB3D9\uBB3C\uBCD1\uC6D0",
    name: "\uB3D9\uBB3C\uBCD1\uC6D0\xB7\uD3AB\uC0F5",
    icon: "\u{1F436}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30 \xB7 \uCC28\uD2B8",
    category: "service",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC9C4\uB8CC\xB7\uCC28\uD2B8\xB7\uACB0\uC81C \uAD00\uB9AC\uAC00 \uD55C \uBC88\uC5D0 \uB418\uB294 \uB3D9\uBB3C\uBCD1\uC6D0\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uBB3C\uBCD1\uC6D0 1\uACF3",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uCC28\uD2B8/\uC608\uC57D SW \uC635\uC158)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC138\uD0C1\uC18C",
    name: "\uC138\uD0C1\uC18C\xB7\uC138\uD0C1\uD3B8\uC758\uC810",
    icon: "\u{1F455}",
    meta: "\uBBF8\uB2C8 POS \xB7 \uB2E8\uB9D0\uAE30",
    category: "service",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC8FC\uBB38 \uC811\uC218\xB7\uD53D\uC5C5\xB7\uACB0\uC81C\uAC00 \uAC00\uBCBC\uC6B4 \uC138\uD0C1\uC18C\xB7\uC138\uD0C1\uD3B8\uC758\uC810\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uC138\uD0C1\uC18C",
        items: ["\uBBF8\uB2C8 \uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uB77C\uBCA8 \uD504\uB9B0\uD130 (\uC635\uC158)"],
        initialCost: "60\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3.5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uCE74\uC13C\uD130",
    name: "\uCE74\uC13C\uD130\xB7\uC790\uB3D9\uCC28\uC815\uBE44",
    icon: "\u{1F527}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30",
    category: "service",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC815\uBE44 \uACAC\uC801\xB7\uACB0\uC81C\xB7\uCC28\uB7C9 \uC774\uB825 \uAD00\uB9AC\uAC00 \uAC00\uB2A5\uD55C \uCE74\uC13C\uD130\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uCE74\uC13C\uD130\xB7\uC815\uBE44\uC18C",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uC815\uBE44 SW \uC635\uC158)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // ===========================================
  // 2차 신규 16개 (간략판 - isSimple: true)
  // ===========================================
  // --- 음식점 (+3) ---
  {
    slug: "\uC77C\uC2DD",
    name: "\uC77C\uC2DD\xB7\uD69F\uC9D1",
    icon: "\u{1F363}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30",
    category: "food",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD68C\xB7\uCD08\uBC25\xB7\uC774\uC790\uCE74\uC57C \uB4F1 \uC77C\uC2DD \uC804\uBB38\uC810 \uC6B4\uC601\uC5D0 \uB9DE\uCD98 \uACB0\uC81C\xB7\uC8FC\uBB38 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "20~40\uD3C9 \uC77C\uC2DD\xB7\uD69F\uC9D1",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130 1\uB300"],
        initialCost: "85\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC911\uC2DD",
    name: "\uC911\uC2DD\xB7\uC9DC\uC7A5\uBA74",
    icon: "\u{1F962}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30 \xB7 \uBC30\uB2EC",
    category: "food",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD640+\uBC30\uB2EC \uBCD1\uD589\uC774 \uB9CE\uC740 \uC911\uC2DD\xB7\uC9DC\uC7A5\uBA74 \uC804\uBB38\uC810\uC5D0 \uCD5C\uC801\uD654\uB41C \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "15~30\uD3C9 \uC911\uC2DD\uB2F9",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uBC30\uB2EC\uC571 \uC5F0\uB3D9)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uC8FC\uBC29 \uD504\uB9B0\uD130"],
        initialCost: "75\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4.5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uD55C\uC2DD\uBDD4\uD398",
    name: "\uD55C\uC2DD\uBDD4\uD398\xB7\uAD6D\uBC25\uC9D1",
    icon: "\u{1F372}",
    meta: "\uD0A4\uC624\uC2A4\uD06C \xB7 POS",
    category: "food",
    isSimple: true,
    recommendedProducts: ["\uD0A4\uC624\uC2A4\uD06C", "\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD68C\uC804\uC728\uC774 \uD575\uC2EC\uC778 \uD55C\uC2DD\uBDD4\uD398\xB7\uAD6D\uBC25\uC9D1\uC744 \uC704\uD55C \uBE60\uB978 \uACB0\uC81C \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uAD6D\uBC25\uC9D1\xB7\uD55C\uC2DD\uBDD4\uD398",
        items: ["\uD0A4\uC624\uC2A4\uD06C 1\uB300 (\uC120\uACB0\uC81C)", "\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "180\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 6\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 카페·디저트 (+2) ---
  {
    slug: "\uBB34\uC778\uCE74\uD398",
    name: "\uBB34\uC778\uCE74\uD398",
    icon: "\u{1F916}",
    meta: "\uD0A4\uC624\uC2A4\uD06C \xB7 CCTV",
    category: "cafe",
    isSimple: true,
    recommendedProducts: ["\uD0A4\uC624\uC2A4\uD06C", "CCTV\uC124\uCE58"],
    description: "24\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601\uC774 \uAC00\uB2A5\uD55C \uBB34\uC778\uCE74\uD398\xB7\uC140\uD504\uCE74\uD398 \uC804\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uBB34\uC778\uCE74\uD398 1\uC9C0\uC810",
        items: ["\uD0A4\uC624\uC2A4\uD06C 1\uB300 (\uC140\uD504 \uACB0\uC81C)", "CCTV 4\uCC44\uB110", "\uB3C4\uC5B4\uB77D \uC5F0\uB3D9 (\uC635\uC158)"],
        initialCost: "320\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 7\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uB5A1\uC9D1",
    name: "\uB5A1\uC9D1\xB7\uC804\uD1B5\uACFC\uC790",
    icon: "\u{1F361}",
    meta: "\uBBF8\uB2C8 POS \xB7 \uB77C\uBCA8",
    category: "cafe",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC18C\uB7C9 \uB2E4\uD488\uC885 \uC6B4\uC601\uC774 \uB9CE\uC740 \uB5A1\uC9D1\xB7\uC804\uD1B5\uACFC\uC790\uC810\uC744 \uC704\uD55C \uAC00\uBCBC\uC6B4 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uB5A1\uC9D1\xB7\uACFC\uC790\uAC00\uAC8C",
        items: ["\uBBF8\uB2C8 \uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uB77C\uBCA8 \uD504\uB9B0\uD130 (\uC635\uC158)"],
        initialCost: "60\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 3.5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 뷰티·패션 (+3) ---
  {
    slug: "\uC18D\uB208\uC379",
    name: "\uC18D\uB208\uC379\xB7\uC641\uC2F1",
    icon: "\u{1F48B}",
    meta: "\uC608\uC57D POS \xB7 \uD68C\uC6D0\uAD8C",
    category: "beauty",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC608\uC57D \uAD00\uB9AC\uC640 \uD68C\uC6D0\uAD8C \uACB0\uC81C\uAC00 \uD55C \uD654\uBA74\uC5D0 \uC815\uB9AC\uB418\uB294 \uBDF0\uD2F0\uC0F5 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC18D\uB208\uC379\xB7\uC641\uC2F1\uC0F5",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uC608\uC57D/\uD68C\uC6D0\uAD8C SW)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "70\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC548\uACBD\uC810",
    name: "\uC548\uACBD\uC810",
    icon: "\u{1F453}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30 \xB7 \uCC28\uD2B8",
    category: "beauty",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC2DC\uB825 \uCC28\uD2B8\xB7\uACE0\uAC1D \uC815\uBCF4 \uAD00\uB9AC\uAC00 \uAC00\uB2A5\uD55C \uC548\uACBD\uC810 \uC804\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uC548\uACBD\uC810",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uACE0\uAC1D/\uCC28\uD2B8 SW \uC635\uC158)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC7A1\uD654\uC810",
    name: "\uC7A1\uD654\xB7\uC561\uC138\uC11C\uB9AC",
    icon: "\u{1F45C}",
    meta: "POS \xB7 \uBC14\uCF54\uB4DC",
    category: "beauty",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uB2E4\uD488\uC885 \uC18C\uB7C9 \uC0C1\uD488 \uAD00\uB9AC\uAC00 \uD575\uC2EC\uC778 \uC7A1\uD654\xB7\uC561\uC138\uC11C\uB9AC \uB9E4\uC7A5 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC18C\xB7\uC911\uD615 \uC7A1\uD654\uC810",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uBC14\uCF54\uB4DC \uC2A4\uCE90\uB108"],
        initialCost: "85\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 판매·소매 (+3) ---
  {
    slug: "\uC815\uC721\uC810",
    name: "\uC815\uC721\uC810\xB7\uBC18\uCC2C\uAC00\uAC8C",
    icon: "\u{1F953}",
    meta: "\uC800\uC6B8 POS \xB7 \uB77C\uBCA8",
    category: "retail",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uBB34\uAC8C\xB7\uC911\uB7C9 \uB2E8\uC704 \uD310\uB9E4\uAC00 \uB9CE\uC740 \uC815\uC721\uC810\xB7\uBC18\uCC2C\uAC00\uAC8C\uC5D0 \uB9DE\uCD98 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uC815\uC721\uC810\xB7\uBC18\uCC2C\uAC00\uAC8C",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uC800\uC6B8 \uC5F0\uB3D9 \uC635\uC158)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uB77C\uBCA8 \uD504\uB9B0\uD130"],
        initialCost: "110\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 6\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uBB38\uAD6C\uC810",
    name: "\uBB38\uAD6C\uC810",
    icon: "\u270F\uFE0F",
    meta: "\uBBF8\uB2C8 POS \xB7 \uBC14\uCF54\uB4DC",
    category: "retail",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD559\uAD50 \uC778\uADFC \uC18C\uD615 \uBB38\uAD6C\uC810\uC5D0 \uB9DE\uCD98 \uAC00\uBCBC\uC6B4 \uACB0\uC81C\xB7\uC7AC\uACE0 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uBB38\uAD6C\uC810",
        items: ["\uBBF8\uB2C8 \uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uBC14\uCF54\uB4DC \uC2A4\uCE90\uB108"],
        initialCost: "75\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC11C\uC810",
    name: "\uC11C\uC810\xB7\uB9CC\uD654\uBC29",
    icon: "\u{1F4DA}",
    meta: "POS \xB7 \uBC14\uCF54\uB4DC",
    category: "retail",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "ISBN \uBC14\uCF54\uB4DC \uCC98\uB9AC\uC640 \uD68C\uC6D0 \uAD00\uB9AC\uAC00 \uAC00\uB2A5\uD55C \uC11C\uC810\xB7\uB9CC\uD654\uBC29 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uC11C\uC810\xB7\uB9CC\uD654\uBC29",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uD68C\uC6D0 SW \uC635\uC158)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300", "\uBC14\uCF54\uB4DC \uC2A4\uCE90\uB108"],
        initialCost: "90\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 운동·교육 (+2) ---
  {
    slug: "\uBBF8\uC220\uD559\uC6D0",
    name: "\uBBF8\uC220\xB7\uC74C\uC545\uD559\uC6D0",
    icon: "\u{1F3A8}",
    meta: "\uCD9C\uACB0 \xB7 \uD68C\uC6D0\uAD8C",
    category: "edu",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uD68C\uC6D0\uAD8C\xB7\uCD9C\uACB0 \uAD00\uB9AC\uAC00 \uD55C \uBC88\uC5D0 \uB418\uB294 \uBBF8\uC220\xB7\uC74C\uC545\uD559\uC6D0 \uC804\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uBBF8\uC220/\uC74C\uC545\uD559\uC6D0",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300 (\uCD9C\uACB0/\uD68C\uC6D0\uAD8C SW)", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "85\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "PC\uBC29",
    name: "PC\uBC29\xB7\uB2F9\uAD6C\uC7A5",
    icon: "\u{1F3AE}",
    meta: "\uC2DC\uAC04\uC81C POS \xB7 \uD0A4\uC624\uC2A4\uD06C",
    category: "edu",
    isSimple: true,
    recommendedProducts: ["\uD0A4\uC624\uC2A4\uD06C", "\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC2DC\uAC04 \uB2E8\uC704 \uACB0\uC81C\uC640 \uBB34\uC778 \uC6B4\uC601\uC774 \uAC00\uB2A5\uD55C PC\uBC29\xB7\uB2F9\uAD6C\uC7A5 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "PC\uBC29\xB7\uB2F9\uAD6C\uC7A5",
        items: ["\uD0A4\uC624\uC2A4\uD06C 1\uB300 (\uC2DC\uAC04\uC81C SW)", "\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "280\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 7\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  // --- 전문서비스 (+3) ---
  {
    slug: "\uBCD1\uC6D0\uC57D\uAD6D",
    name: "\uBCD1\uC6D0\xB7\uC57D\uAD6D",
    icon: "\u{1F3E5}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30 \xB7 \uCC28\uD2B8",
    category: "service",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC9C4\uB8CC\uBE44 \uACB0\uC81C\xB7\uCC28\uD2B8 \uC5F0\uB3D9\uC774 \uAC00\uB2A5\uD55C \uC758\uC6D0\xB7\uC57D\uAD6D \uC804\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uC758\uC6D0\xB7\uC57D\uAD6D",
        items: ["\uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300 (\uC758\uB8CC \uACB0\uC81C \uB300\uC751)"],
        initialCost: "95\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 5.5\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uC0AC\uC9C4\uAD00",
    name: "\uC0AC\uC9C4\uAD00\xB7\uC99D\uBA85\uC0AC\uC9C4",
    icon: "\u{1F4F7}",
    meta: "\uBBF8\uB2C8 POS \xB7 \uB2E8\uB9D0\uAE30",
    category: "service",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uC608\uC57D\xB7\uACB0\uC81C\xB7\uC791\uC5C5 \uC774\uB825 \uAD00\uB9AC\uAC00 \uAC00\uB2A5\uD55C \uC0AC\uC9C4\uAD00 \uC804\uC6A9 \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uB3D9\uB124 \uC0AC\uC9C4\uAD00",
        items: ["\uBBF8\uB2C8 \uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "70\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~",
        popular: true
      }
    ]
  },
  {
    slug: "\uBD80\uB3D9\uC0B0",
    name: "\uBD80\uB3D9\uC0B0\xB7\uACF5\uC778\uC911\uAC1C\uC0AC",
    icon: "\u{1F3E0}",
    meta: "POS \xB7 \uB2E8\uB9D0\uAE30",
    category: "service",
    isSimple: true,
    recommendedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30"],
    description: "\uACC4\uC57D\xB7\uC911\uAC1C \uC218\uC218\uB8CC \uACB0\uC81C\uAC00 \uAE54\uB054\uD55C \uBD80\uB3D9\uC0B0\xB7\uACF5\uC778\uC911\uAC1C\uC0AC \uD328\uD0A4\uC9C0.",
    packages: [
      {
        tier: "standard",
        name: "\uD45C\uC900 \uAD6C\uC131",
        target: "\uACF5\uC778\uC911\uAC1C\uC0AC \uC0AC\uBB34\uC18C",
        items: ["\uBBF8\uB2C8 \uD3EC\uC2A4\uAE30 1\uB300", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 1\uB300"],
        initialCost: "70\uB9CC\uC6D0~",
        monthlyCost: "\uC6D4 4\uB9CC\uC6D0~",
        popular: true
      }
    ]
  }
];
function findIndustry(slug) {
  return industries.find((i) => i.slug === slug);
}

// src/components/sections/Industries.tsx
var categories = [
  { key: "food", label: "\uC74C\uC2DD\uC810" },
  { key: "cafe", label: "\uCE74\uD398\xB7\uB514\uC800\uD2B8" },
  { key: "beauty", label: "\uBDF0\uD2F0\xB7\uD328\uC158" },
  { key: "retail", label: "\uD310\uB9E4\xB7\uC18C\uB9E4" },
  { key: "edu", label: "\uC6B4\uB3D9\xB7\uAD50\uC721" },
  { key: "service", label: "\uC804\uBB38\uC11C\uBE44\uC2A4" }
];
var categorySubs = {
  food: "\uC2DD\uB2F9\xB7\uCE58\uD0A8\xB7\uACE0\uAE30\xB7\uD3EC\uCC28\uAE4C\uC9C0 \uC74C\uC2DD\uC810 \uC804\uBC18\uC5D0 \uB9DE\uCDA4 \uD328\uD0A4\uC9C0",
  cafe: "\uC18C\uD615 \uCE74\uD398\uBD80\uD130 \uBCA0\uC774\uCEE4\uB9AC\xB7\uB514\uC800\uD2B8\uAE4C\uC9C0 \uAC00\uBCBC\uC6B4 \uAD6C\uC131",
  beauty: "\uC608\uC57D\xB7\uD68C\uC6D0\uAD8C\xB7\uC7AC\uACE0\uAC00 \uD55C \uD654\uBA74\uC5D0 \uC815\uB9AC\uB418\uB294 \uB9E4\uC7A5\uC6A9",
  retail: "\uBC14\uCF54\uB4DC\xB7\uC7AC\uACE0\xB724\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601\uAE4C\uC9C0 \uB300\uC751",
  edu: "\uD68C\uC6D0\uAD8C\xB7\uCD9C\uACB0\xB7\uC815\uAE30\uACB0\uC81C\uAC00 \uD55C \uBC88\uC5D0 \uCC98\uB9AC\uB418\uB294 \uC2DC\uC2A4\uD15C",
  service: "\uC9C4\uB8CC \uCC28\uD2B8\xB7\uC815\uBE44 \uC774\uB825\xB7\uACB0\uC81C\uAE4C\uC9C0 \uD1B5\uD569 \uAD00\uB9AC"
};
var Industries = () => {
  const byCategory = {
    food: [],
    cafe: [],
    beauty: [],
    retail: [],
    edu: [],
    service: []
  };
  for (const i of industries)
    byCategory[i.category].push(i);
  return /* @__PURE__ */ jsxDEV("section", { class: "industries", id: "industries", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "BY INDUSTRY" }),
      /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
        "\uC5C5\uC885\uBCC4 ",
        /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uB9DE\uCDA4 \uAD6C\uC131." })
      ] }),
      /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uCE74\uD14C\uACE0\uB9AC\uB97C \uC120\uD0DD\uD558\uBA74 \uC138\uBD80 \uC5C5\uC885\uC774 \uD3BC\uCCD0\uC9D1\uB2C8\uB2E4. \uC6B0\uB9AC \uB9E4\uC7A5\uC5D0 \uB9DE\uB294 \uD328\uD0A4\uC9C0\uB97C \uD655\uC778\uD558\uC138\uC694." }),
      /* @__PURE__ */ jsxDEV("div", { class: "ind-split", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "ind-cat-menu", role: "tablist", children: categories.map((cat, idx) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            class: `ind-cat-btn${idx === 0 ? " active" : ""}`,
            "data-cat": cat.key,
            role: "tab",
            children: [
              /* @__PURE__ */ jsxDEV("span", { class: "ind-cat-name", children: cat.label }),
              /* @__PURE__ */ jsxDEV("span", { class: "ind-cat-count", children: byCategory[cat.key].length })
            ]
          }
        )) }),
        /* @__PURE__ */ jsxDEV("div", { class: "ind-cat-panels", children: categories.map((cat, idx) => /* @__PURE__ */ jsxDEV(
          "div",
          {
            class: `ind-cat-panel${idx === 0 ? " active" : ""}`,
            "data-cat": cat.key,
            role: "tabpanel",
            children: [
              /* @__PURE__ */ jsxDEV("h3", { class: "ind-cat-title", children: cat.label }),
              /* @__PURE__ */ jsxDEV("p", { class: "ind-cat-sub", children: categorySubs[cat.key] }),
              /* @__PURE__ */ jsxDEV("div", { class: "ind-items", children: byCategory[cat.key].map((ind) => /* @__PURE__ */ jsxDEV("a", { href: `/\uC5C5\uC885/${ind.slug}`, class: "ind-item", children: ind.name.split("\xB7")[0] })) })
            ]
          }
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV(
      "script",
      {
        dangerouslySetInnerHTML: {
          __html: `
(function() {
  var btns = document.querySelectorAll('.ind-cat-btn');
  var panels = document.querySelectorAll('.ind-cat-panel');
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.getAttribute('data-cat');
      btns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      panels.forEach(function(p) {
        if (p.getAttribute('data-cat') === key) p.classList.add('active');
        else p.classList.remove('active');
      });
    });
  });
})();
          `
        }
      }
    )
  ] });
};

// src/data/regions.ts
var regions = [
  {
    code: "seoul",
    nameKo: "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC",
    nameKoShort: "\uC11C\uC6B8",
    nameEn: "Seoul",
    districts: [
    { slug: "중구", name: "중구", nameEn: "", dongs: [
      { slug: "남대문로4가", name: "남대문로4가" },
      { slug: "남산동2가", name: "남산동2가" },
      { slug: "남산동3가", name: "남산동3가" },
      { slug: "봉래동1가", name: "봉래동1가" },
      { slug: "봉래동2가", name: "봉래동2가" },
      { slug: "회현동1가", name: "회현동1가" },
      { slug: "충무로5가", name: "충무로5가" },
      { slug: "충무로1가", name: "충무로1가" },
      { slug: "회현동2가", name: "회현동2가" },
      { slug: "명동1가", name: "명동1가" },
      { slug: "명동2가", name: "명동2가" },
      { slug: "남산동1가", name: "남산동1가" },
      { slug: "을지로6가", name: "을지로6가" },
      { slug: "을지로7가", name: "을지로7가" },
      { slug: "중구", name: "중구" },
      { slug: "무교동", name: "무교동" },
      { slug: "다동", name: "다동" },
      { slug: "태평로1가", name: "태평로1가" },
      { slug: "을지로1가", name: "을지로1가" },
      { slug: "을지로2가", name: "을지로2가" },
      { slug: "남대문로1가", name: "남대문로1가" },
      { slug: "삼각동", name: "삼각동" },
      { slug: "수하동", name: "수하동" },
      { slug: "장교동", name: "장교동" },
      { slug: "수표동", name: "수표동" },
      { slug: "소공동", name: "소공동" },
      { slug: "남대문로3가", name: "남대문로3가" },
      { slug: "남대문로5가", name: "남대문로5가" },
      { slug: "충무로3가", name: "충무로3가" },
      { slug: "초동", name: "초동" },
      { slug: "인현동1가", name: "인현동1가" },
      { slug: "저동2가", name: "저동2가" },
      { slug: "신당동", name: "신당동" },
      { slug: "흥인동", name: "흥인동" },
      { slug: "무학동", name: "무학동" },
      { slug: "황학동", name: "황학동" },
      { slug: "서소문동", name: "서소문동" },
      { slug: "회현동3가", name: "회현동3가" },
      { slug: "순화동", name: "순화동" },
      { slug: "정동", name: "정동" },
      { slug: "태평로2가", name: "태평로2가" },
      { slug: "남대문로2가", name: "남대문로2가" },
      { slug: "의주로1가", name: "의주로1가" },
      { slug: "충정로1가", name: "충정로1가" },
      { slug: "중림동", name: "중림동" },
      { slug: "의주로2가", name: "의주로2가" },
      { slug: "인현동2가", name: "인현동2가" },
      { slug: "예관동", name: "예관동" },
      { slug: "묵정동", name: "묵정동" },
      { slug: "필동1가", name: "필동1가" },
      { slug: "만리동1가", name: "만리동1가" },
      { slug: "만리동2가", name: "만리동2가" },
      { slug: "산림동", name: "산림동" },
      { slug: "을지로3가", name: "을지로3가" },
      { slug: "입정동", name: "입정동" },
      { slug: "남창동", name: "남창동" },
      { slug: "북창동", name: "북창동" },
      { slug: "저동1가", name: "저동1가" },
      { slug: "충무로4가", name: "충무로4가" },
      { slug: "충무로2가", name: "충무로2가" },
      { slug: "을지로4가", name: "을지로4가" },
      { slug: "을지로5가", name: "을지로5가" },
      { slug: "주교동", name: "주교동" },
      { slug: "방산동", name: "방산동" },
      { slug: "오장동", name: "오장동" },
      { slug: "필동2가", name: "필동2가" },
      { slug: "필동3가", name: "필동3가" },
      { slug: "남학동", name: "남학동" },
      { slug: "주자동", name: "주자동" },
      { slug: "예장동", name: "예장동" },
      { slug: "장충동1가", name: "장충동1가" },
      { slug: "장충동2가", name: "장충동2가" },
      { slug: "광희동1가", name: "광희동1가" },
      { slug: "광희동2가", name: "광희동2가" },
      { slug: "쌍림동", name: "쌍림동" }
    ] },
    { slug: "서대문구", name: "서대문구", nameEn: "", dongs: [
      { slug: "남가좌동", name: "남가좌동" },
      { slug: "홍제동", name: "홍제동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "봉원동", name: "봉원동" },
      { slug: "창천동", name: "창천동" },
      { slug: "홍은동", name: "홍은동" },
      { slug: "영천동", name: "영천동" },
      { slug: "현저동", name: "현저동" },
      { slug: "북아현동", name: "북아현동" },
      { slug: "북가좌동", name: "북가좌동" },
      { slug: "대현동", name: "대현동" },
      { slug: "대신동", name: "대신동" },
      { slug: "서대문구", name: "서대문구" },
      { slug: "충정로2가", name: "충정로2가" },
      { slug: "충정로3가", name: "충정로3가" },
      { slug: "합동", name: "합동" },
      { slug: "미근동", name: "미근동" },
      { slug: "냉천동", name: "냉천동" },
      { slug: "천연동", name: "천연동" },
      { slug: "옥천동", name: "옥천동" },
      { slug: "연희동", name: "연희동" }
    ] },
    { slug: "영등포구", name: "영등포구", nameEn: "", dongs: [
      { slug: "영등포동", name: "영등포동" },
      { slug: "양평동1가", name: "양평동1가" },
      { slug: "양평동2가", name: "양평동2가" },
      { slug: "양평동3가", name: "양평동3가" },
      { slug: "양평동6가", name: "양평동6가" },
      { slug: "양평동4가", name: "양평동4가" },
      { slug: "양평동5가", name: "양평동5가" },
      { slug: "신길동", name: "신길동" },
      { slug: "대림동", name: "대림동" },
      { slug: "양평동", name: "양평동" },
      { slug: "영등포동1가", name: "영등포동1가" },
      { slug: "영등포동2가", name: "영등포동2가" },
      { slug: "영등포동3가", name: "영등포동3가" },
      { slug: "양화동", name: "양화동" },
      { slug: "당산동6가", name: "당산동6가" },
      { slug: "당산동", name: "당산동" },
      { slug: "도림동", name: "도림동" },
      { slug: "문래동1가", name: "문래동1가" },
      { slug: "문래동2가", name: "문래동2가" },
      { slug: "문래동3가", name: "문래동3가" },
      { slug: "문래동4가", name: "문래동4가" },
      { slug: "문래동5가", name: "문래동5가" },
      { slug: "문래동6가", name: "문래동6가" },
      { slug: "당산동1가", name: "당산동1가" },
      { slug: "당산동2가", name: "당산동2가" },
      { slug: "당산동3가", name: "당산동3가" },
      { slug: "영등포동4가", name: "영등포동4가" },
      { slug: "영등포동5가", name: "영등포동5가" },
      { slug: "영등포동6가", name: "영등포동6가" },
      { slug: "영등포동7가", name: "영등포동7가" },
      { slug: "영등포동8가", name: "영등포동8가" },
      { slug: "여의도동", name: "여의도동" },
      { slug: "당산동4가", name: "당산동4가" },
      { slug: "당산동5가", name: "당산동5가" },
      { slug: "영등포구", name: "영등포구" }
    ] },
    { slug: "강북구", name: "강북구", nameEn: "", dongs: [
      { slug: "수유동", name: "수유동" },
      { slug: "미아동", name: "미아동" },
      { slug: "번동", name: "번동" },
      { slug: "강북구", name: "강북구" },
      { slug: "우이동", name: "우이동" }
    ] },
    { slug: "성동구", name: "성동구", nameEn: "", dongs: [
      { slug: "금호동1가", name: "금호동1가" },
      { slug: "금호동2가", name: "금호동2가" },
      { slug: "금호동3가", name: "금호동3가" },
      { slug: "금호동4가", name: "금호동4가" },
      { slug: "옥수동", name: "옥수동" },
      { slug: "성수동1가", name: "성수동1가" },
      { slug: "성수동2가", name: "성수동2가" },
      { slug: "송정동", name: "송정동" },
      { slug: "상왕십리동", name: "상왕십리동" },
      { slug: "하왕십리동", name: "하왕십리동" },
      { slug: "홍익동", name: "홍익동" },
      { slug: "용답동", name: "용답동" },
      { slug: "도선동", name: "도선동" },
      { slug: "마장동", name: "마장동" },
      { slug: "사근동", name: "사근동" },
      { slug: "행당동", name: "행당동" },
      { slug: "응봉동", name: "응봉동" },
      { slug: "성동구", name: "성동구" }
    ] },
    { slug: "용산구", name: "용산구", nameEn: "", dongs: [
      { slug: "원효로1가", name: "원효로1가" },
      { slug: "원효로2가", name: "원효로2가" },
      { slug: "신창동", name: "신창동" },
      { slug: "청암동", name: "청암동" },
      { slug: "원효로3가", name: "원효로3가" },
      { slug: "이촌동", name: "이촌동" },
      { slug: "이태원동", name: "이태원동" },
      { slug: "원효로4가", name: "원효로4가" },
      { slug: "효창동", name: "효창동" },
      { slug: "도원동", name: "도원동" },
      { slug: "용문동", name: "용문동" },
      { slug: "문배동", name: "문배동" },
      { slug: "신계동", name: "신계동" },
      { slug: "한강로1가", name: "한강로1가" },
      { slug: "한강로2가", name: "한강로2가" },
      { slug: "용산동3가", name: "용산동3가" },
      { slug: "청파동2가", name: "청파동2가" },
      { slug: "청파동3가", name: "청파동3가" },
      { slug: "산천동", name: "산천동" },
      { slug: "주성동", name: "주성동" },
      { slug: "용산동6가", name: "용산동6가" },
      { slug: "보광동", name: "보광동" },
      { slug: "용산구", name: "용산구" },
      { slug: "후암동", name: "후암동" },
      { slug: "용산동2가", name: "용산동2가" },
      { slug: "용산동4가", name: "용산동4가" },
      { slug: "갈월동", name: "갈월동" },
      { slug: "남영동", name: "남영동" },
      { slug: "용산동1가", name: "용산동1가" },
      { slug: "동자동", name: "동자동" },
      { slug: "서계동", name: "서계동" },
      { slug: "용산동5가", name: "용산동5가" },
      { slug: "한강로3가", name: "한강로3가" },
      { slug: "청파동1가", name: "청파동1가" },
      { slug: "한남동", name: "한남동" },
      { slug: "동빙고동", name: "동빙고동" },
      { slug: "서빙고동", name: "서빙고동" }
    ] },
    { slug: "강남구", name: "강남구", nameEn: "", dongs: [
      { slug: "일원동", name: "일원동" },
      { slug: "도곡동", name: "도곡동" },
      { slug: "청담동", name: "청담동" },
      { slug: "삼성동", name: "삼성동" },
      { slug: "대치동", name: "대치동" },
      { slug: "신사동", name: "신사동" },
      { slug: "논현동", name: "논현동" },
      { slug: "압구정동", name: "압구정동" },
      { slug: "세곡동", name: "세곡동" },
      { slug: "자곡동", name: "자곡동" },
      { slug: "율현동", name: "율현동" },
      { slug: "개포동", name: "개포동" },
      { slug: "수서동", name: "수서동" },
      { slug: "역삼동", name: "역삼동" },
      { slug: "강남구", name: "강남구" }
    ] },
    { slug: "종로구", name: "종로구", nameEn: "", dongs: [
      { slug: "가회동", name: "가회동" },
      { slug: "재동", name: "재동" },
      { slug: "계동", name: "계동" },
      { slug: "원서동", name: "원서동" },
      { slug: "훈정동", name: "훈정동" },
      { slug: "숭인동", name: "숭인동" },
      { slug: "교남동", name: "교남동" },
      { slug: "평동", name: "평동" },
      { slug: "송월동", name: "송월동" },
      { slug: "홍파동", name: "홍파동" },
      { slug: "교북동", name: "교북동" },
      { slug: "행촌동", name: "행촌동" },
      { slug: "구기동", name: "구기동" },
      { slug: "창신동", name: "창신동" },
      { slug: "중학동", name: "중학동" },
      { slug: "종로1가", name: "종로1가" },
      { slug: "공평동", name: "공평동" },
      { slug: "관훈동", name: "관훈동" },
      { slug: "내자동", name: "내자동" },
      { slug: "사직동", name: "사직동" },
      { slug: "관수동", name: "관수동" },
      { slug: "종로구", name: "종로구" },
      { slug: "청운동", name: "청운동" },
      { slug: "신교동", name: "신교동" },
      { slug: "궁정동", name: "궁정동" },
      { slug: "효자동", name: "효자동" },
      { slug: "창성동", name: "창성동" },
      { slug: "통의동", name: "통의동" },
      { slug: "적선동", name: "적선동" },
      { slug: "통인동", name: "통인동" },
      { slug: "누상동", name: "누상동" },
      { slug: "누하동", name: "누하동" },
      { slug: "옥인동", name: "옥인동" },
      { slug: "체부동", name: "체부동" },
      { slug: "필운동", name: "필운동" },
      { slug: "효제동", name: "효제동" },
      { slug: "평창동", name: "평창동" },
      { slug: "소격동", name: "소격동" },
      { slug: "화동", name: "화동" },
      { slug: "장사동", name: "장사동" },
      { slug: "동숭동", name: "동숭동" },
      { slug: "무악동", name: "무악동" },
      { slug: "부암동", name: "부암동" },
      { slug: "종로3가", name: "종로3가" },
      { slug: "종로5가", name: "종로5가" },
      { slug: "종로6가", name: "종로6가" },
      { slug: "이화동", name: "이화동" },
      { slug: "연건동", name: "연건동" },
      { slug: "충신동", name: "충신동" },
      { slug: "혜화동", name: "혜화동" },
      { slug: "명륜1가", name: "명륜1가" },
      { slug: "명륜2가", name: "명륜2가" },
      { slug: "신문로1가", name: "신문로1가" },
      { slug: "신문로2가", name: "신문로2가" },
      { slug: "청진동", name: "청진동" },
      { slug: "서린동", name: "서린동" },
      { slug: "수송동", name: "수송동" },
      { slug: "와룡동", name: "와룡동" },
      { slug: "권농동", name: "권농동" },
      { slug: "운니동", name: "운니동" },
      { slug: "익선동", name: "익선동" },
      { slug: "경운동", name: "경운동" },
      { slug: "관철동", name: "관철동" },
      { slug: "인사동", name: "인사동" },
      { slug: "낙원동", name: "낙원동" },
      { slug: "종로2가", name: "종로2가" },
      { slug: "팔판동", name: "팔판동" },
      { slug: "삼청동", name: "삼청동" },
      { slug: "안국동", name: "안국동" },
      { slug: "인의동", name: "인의동" },
      { slug: "예지동", name: "예지동" },
      { slug: "원남동", name: "원남동" },
      { slug: "홍지동", name: "홍지동" },
      { slug: "신영동", name: "신영동" },
      { slug: "사간동", name: "사간동" },
      { slug: "송현동", name: "송현동" },
      { slug: "돈의동", name: "돈의동" },
      { slug: "도렴동", name: "도렴동" },
      { slug: "당주동", name: "당주동" },
      { slug: "내수동", name: "내수동" },
      { slug: "세종로", name: "세종로" },
      { slug: "연지동", name: "연지동" },
      { slug: "종로4가", name: "종로4가" },
      { slug: "묘동", name: "묘동" },
      { slug: "봉익동", name: "봉익동" },
      { slug: "견지동", name: "견지동" },
      { slug: "명륜4가", name: "명륜4가" },
      { slug: "명륜3가", name: "명륜3가" }
    ] },
    { slug: "성북구", name: "성북구", nameEn: "", dongs: [
      { slug: "길음동", name: "길음동" },
      { slug: "안암동2가", name: "안암동2가" },
      { slug: "안암동3가", name: "안암동3가" },
      { slug: "보문동6가", name: "보문동6가" },
      { slug: "돈암동", name: "돈암동" },
      { slug: "동소문동1가", name: "동소문동1가" },
      { slug: "동소문동2가", name: "동소문동2가" },
      { slug: "동소문동3가", name: "동소문동3가" },
      { slug: "동소문동4가", name: "동소문동4가" },
      { slug: "보문동7가", name: "보문동7가" },
      { slug: "보문동1가", name: "보문동1가" },
      { slug: "보문동2가", name: "보문동2가" },
      { slug: "성북동1가", name: "성북동1가" },
      { slug: "동소문동5가", name: "동소문동5가" },
      { slug: "동소문동6가", name: "동소문동6가" },
      { slug: "동소문동7가", name: "동소문동7가" },
      { slug: "삼선동1가", name: "삼선동1가" },
      { slug: "삼선동2가", name: "삼선동2가" },
      { slug: "하월곡동", name: "하월곡동" },
      { slug: "상월곡동", name: "상월곡동" },
      { slug: "장위동", name: "장위동" },
      { slug: "석관동", name: "석관동" },
      { slug: "삼선동3가", name: "삼선동3가" },
      { slug: "성북구", name: "성북구" },
      { slug: "성북동", name: "성북동" },
      { slug: "보문동3가", name: "보문동3가" },
      { slug: "정릉동", name: "정릉동" },
      { slug: "종암동", name: "종암동" },
      { slug: "안암동4가", name: "안암동4가" },
      { slug: "안암동5가", name: "안암동5가" },
      { slug: "보문동4가", name: "보문동4가" },
      { slug: "보문동5가", name: "보문동5가" },
      { slug: "삼선동4가", name: "삼선동4가" },
      { slug: "삼선동5가", name: "삼선동5가" },
      { slug: "동선동1가", name: "동선동1가" },
      { slug: "동선동2가", name: "동선동2가" },
      { slug: "동선동3가", name: "동선동3가" },
      { slug: "동선동4가", name: "동선동4가" },
      { slug: "동선동5가", name: "동선동5가" },
      { slug: "안암동1가", name: "안암동1가" }
    ] },
    { slug: "강동구", name: "강동구", nameEn: "", dongs: [
      { slug: "암사동", name: "암사동" },
      { slug: "천호동", name: "천호동" },
      { slug: "강일동", name: "강일동" },
      { slug: "성내동", name: "성내동" },
      { slug: "둔촌동", name: "둔촌동" },
      { slug: "강동구", name: "강동구" },
      { slug: "명일동", name: "명일동" },
      { slug: "고덕동", name: "고덕동" },
      { slug: "상일동", name: "상일동" },
      { slug: "길동", name: "길동" }
    ] },
    { slug: "동대문구", name: "동대문구", nameEn: "", dongs: [
      { slug: "휘경동", name: "휘경동" },
      { slug: "전농동", name: "전농동" },
      { slug: "동대문구", name: "동대문구" },
      { slug: "신설동", name: "신설동" },
      { slug: "용두동", name: "용두동" },
      { slug: "제기동", name: "제기동" },
      { slug: "이문동", name: "이문동" },
      { slug: "답십리동", name: "답십리동" },
      { slug: "장안동", name: "장안동" },
      { slug: "청량리동", name: "청량리동" },
      { slug: "회기동", name: "회기동" }
    ] },
    { slug: "도봉구", name: "도봉구", nameEn: "", dongs: [
      { slug: "도봉동", name: "도봉동" },
      { slug: "쌍문동", name: "쌍문동" },
      { slug: "방학동", name: "방학동" },
      { slug: "창동", name: "창동" },
      { slug: "도봉구", name: "도봉구" }
    ] },
    { slug: "노원구", name: "노원구", nameEn: "", dongs: [
      { slug: "노원구", name: "노원구" },
      { slug: "월계동", name: "월계동" },
      { slug: "공릉동", name: "공릉동" },
      { slug: "하계동", name: "하계동" },
      { slug: "상계동", name: "상계동" },
      { slug: "중계동", name: "중계동" }
    ] },
    { slug: "광진구", name: "광진구", nameEn: "", dongs: [
      { slug: "광장동", name: "광장동" },
      { slug: "자양동", name: "자양동" },
      { slug: "군자동", name: "군자동" },
      { slug: "화양동", name: "화양동" },
      { slug: "광진구", name: "광진구" },
      { slug: "중곡동", name: "중곡동" },
      { slug: "능동", name: "능동" },
      { slug: "구의동", name: "구의동" }
    ] },
    { slug: "강서구", name: "강서구", nameEn: "", dongs: [
      { slug: "화곡동", name: "화곡동" },
      { slug: "개화동", name: "개화동" },
      { slug: "과해동", name: "과해동" },
      { slug: "오곡동", name: "오곡동" },
      { slug: "오쇠동", name: "오쇠동" },
      { slug: "등촌동", name: "등촌동" },
      { slug: "가양동", name: "가양동" },
      { slug: "마곡동", name: "마곡동" },
      { slug: "강서구", name: "강서구" },
      { slug: "염창동", name: "염창동" },
      { slug: "내발산동", name: "내발산동" },
      { slug: "외발산동", name: "외발산동" },
      { slug: "공항동", name: "공항동" },
      { slug: "방화동", name: "방화동" }
    ] },
    { slug: "서초구", name: "서초구", nameEn: "", dongs: [
      { slug: "반포동", name: "반포동" },
      { slug: "서초동", name: "서초동" },
      { slug: "잠원동", name: "잠원동" },
      { slug: "방배동", name: "방배동" },
      { slug: "양재동", name: "양재동" },
      { slug: "우면동", name: "우면동" },
      { slug: "서초구", name: "서초구" },
      { slug: "내곡동", name: "내곡동" },
      { slug: "원지동", name: "원지동" },
      { slug: "염곡동", name: "염곡동" },
      { slug: "신원동", name: "신원동" }
    ] },
    { slug: "구로구", name: "구로구", nameEn: "", dongs: [
      { slug: "구로구", name: "구로구" },
      { slug: "신도림동", name: "신도림동" },
      { slug: "구로동", name: "구로동" },
      { slug: "온수동", name: "온수동" },
      { slug: "천왕동", name: "천왕동" },
      { slug: "항동", name: "항동" },
      { slug: "가리봉동", name: "가리봉동" },
      { slug: "고척동", name: "고척동" },
      { slug: "개봉동", name: "개봉동" },
      { slug: "오류동", name: "오류동" },
      { slug: "궁동", name: "궁동" }
    ] },
    { slug: "은평구", name: "은평구", nameEn: "", dongs: [
      { slug: "갈현동", name: "갈현동" },
      { slug: "구산동", name: "구산동" },
      { slug: "응암동", name: "응암동" },
      { slug: "역촌동", name: "역촌동" },
      { slug: "대조동", name: "대조동" },
      { slug: "신사동", name: "신사동" },
      { slug: "증산동", name: "증산동" },
      { slug: "진관동", name: "진관동" },
      { slug: "은평구", name: "은평구" },
      { slug: "수색동", name: "수색동" },
      { slug: "녹번동", name: "녹번동" },
      { slug: "불광동", name: "불광동" }
    ] },
    { slug: "마포구", name: "마포구", nameEn: "", dongs: [
      { slug: "합정동", name: "합정동" },
      { slug: "망원동", name: "망원동" },
      { slug: "연남동", name: "연남동" },
      { slug: "당인동", name: "당인동" },
      { slug: "서교동", name: "서교동" },
      { slug: "동교동", name: "동교동" },
      { slug: "노고산동", name: "노고산동" },
      { slug: "신수동", name: "신수동" },
      { slug: "현석동", name: "현석동" },
      { slug: "구수동", name: "구수동" },
      { slug: "창전동", name: "창전동" },
      { slug: "상수동", name: "상수동" },
      { slug: "하중동", name: "하중동" },
      { slug: "마포구", name: "마포구" },
      { slug: "아현동", name: "아현동" },
      { slug: "공덕동", name: "공덕동" },
      { slug: "신정동", name: "신정동" },
      { slug: "신공덕동", name: "신공덕동" },
      { slug: "대흥동", name: "대흥동" },
      { slug: "염리동", name: "염리동" },
      { slug: "도화동", name: "도화동" },
      { slug: "마포동", name: "마포동" },
      { slug: "용강동", name: "용강동" },
      { slug: "토정동", name: "토정동" },
      { slug: "성산동", name: "성산동" },
      { slug: "중동", name: "중동" },
      { slug: "상암동", name: "상암동" }
    ] },
    { slug: "중랑구", name: "중랑구", nameEn: "", dongs: [
      { slug: "면목동", name: "면목동" },
      { slug: "중랑구", name: "중랑구" },
      { slug: "신내동", name: "신내동" },
      { slug: "묵동", name: "묵동" },
      { slug: "망우동", name: "망우동" },
      { slug: "상봉동", name: "상봉동" },
      { slug: "중화동", name: "중화동" }
    ] },
    { slug: "송파구", name: "송파구", nameEn: "", dongs: [
      { slug: "가락동", name: "가락동" },
      { slug: "문정동", name: "문정동" },
      { slug: "장지동", name: "장지동" },
      { slug: "신천동", name: "신천동" },
      { slug: "풍납동", name: "풍납동" },
      { slug: "송파구", name: "송파구" },
      { slug: "잠실동", name: "잠실동" },
      { slug: "방이동", name: "방이동" },
      { slug: "오금동", name: "오금동" },
      { slug: "거여동", name: "거여동" },
      { slug: "마천동", name: "마천동" },
      { slug: "삼전동", name: "삼전동" },
      { slug: "송파동", name: "송파동" },
      { slug: "석촌동", name: "석촌동" }
    ] },
    { slug: "양천구", name: "양천구", nameEn: "", dongs: [
      { slug: "목동", name: "목동" },
      { slug: "신월동", name: "신월동" },
      { slug: "신정동", name: "신정동" },
      { slug: "양천구", name: "양천구" }
    ] },
    { slug: "동작구", name: "동작구", nameEn: "", dongs: [
      { slug: "동작구", name: "동작구" },
      { slug: "노량진동", name: "노량진동" },
      { slug: "상도동", name: "상도동" },
      { slug: "사당동", name: "사당동" },
      { slug: "대방동", name: "대방동" },
      { slug: "신대방동", name: "신대방동" },
      { slug: "상도1동", name: "상도1동" },
      { slug: "본동", name: "본동" },
      { slug: "흑석동", name: "흑석동" },
      { slug: "동작동", name: "동작동" }
    ] },
    { slug: "금천구", name: "금천구", nameEn: "", dongs: [
      { slug: "금천구", name: "금천구" },
      { slug: "가산동", name: "가산동" },
      { slug: "독산동", name: "독산동" },
      { slug: "시흥동", name: "시흥동" }
    ] },
    { slug: "관악구", name: "관악구", nameEn: "", dongs: [
      { slug: "신림동", name: "신림동" },
      { slug: "남현동", name: "남현동" },
      { slug: "관악구", name: "관악구" },
      { slug: "봉천동", name: "봉천동" }
    ] }
  ],
    districtCount: 25,
    dongCount: 467,
    // 실제 행정동 수
    characteristics: {
      summary: "\uACE0\uBC00\uB3C4 \uC0C1\uAD8C\uACFC 24\uC2DC\uAC04 \uC6B4\uC601 \uB9E4\uC7A5\uC774 \uC9D1\uC911\uB41C \uB300\uB3C4\uC2DC\uD615 \uBE44\uC988\uB2C8\uC2A4 \uD658\uACBD",
      storeTypes: ["\uC18C\uD615 \uCE74\uD398\xB7\uC2DD\uB2F9", "24\uC2DC\uAC04 \uD3B8\uC758\uC810", "\uD504\uB9AC\uBBF8\uC5C4 \uBE0C\uB79C\uB4DC\uC0F5", "\uC9C0\uD558\uC0C1\uAC00 \uB9E4\uC7A5"],
      customerBase: ["\uC9C1\uC7A5\uC778 \uACE0\uAC1D (70%)", "\uC678\uAD6D\uC778 \uAD00\uAD11\uAC1D", "\uC720\uB3D9 \uC778\uAD6C \uC911\uC2EC", "\uBE60\uB978 \uACB0\uC81C \uC120\uD638"],
      businessHours: "24\uC2DC\uAC04\xB7\uC2EC\uC57C \uC6B4\uC601 \uB9E4\uC7A5 \uB2E4\uC218, \uD3C9\uC77C \uC624\uD6C4 6-9\uC2DC \uD53C\uD06C\uD0C0\uC784 \uC9D1\uC911"
    },
    businessEnvironment: {
      majorIndustries: ["\uCE74\uD398\xB7\uB808\uC2A4\uD1A0\uB791", "\uC18C\uB9E4\xB7\uC720\uD1B5", "\uC11C\uBE44\uC2A4\uC5C5", "\uC5D4\uD130\uD14C\uC778\uBA3C\uD2B8"],
      commercialAreas: ["\uAC15\uB0A8\uC5ED\xB7\uC5ED\uC0BC", "\uD64D\uB300\xB7\uB9C8\uD3EC", "\uBA85\uB3D9\xB7\uC911\uAD6C", "\uC774\uD0DC\uC6D0\xB7\uD55C\uB0A8\uB3D9"],
      infrastructure: ["\uC9C0\uD558\uCCA0 2\uD638\uC120 \uC9D1\uC911", "\uC881\uC740 \uB9E4\uC7A5 \uBA74\uC801", "\uB192\uC740 \uC784\uB300\uB8CC", "\uB3C4\uC2DC\uAC00\uC2A4\xB7\uAD11\uD1B5\uC2E0\uB9DD \uC644\uBE44"]
    },
    installationTips: [
      "\uC881\uC740 \uACF5\uAC04\uC5D0 \uCD5C\uC801\uD654\uB41C \uC18C\uD615\xB7\uBCBD\uAC78\uC774\uD615 \uC7A5\uBE44 \uC120\uD638",
      "24\uC2DC\uAC04 \uC6B4\uC601\uC73C\uB85C \uC778\uD55C \uB0B4\uAD6C\uC131\xB7\uC548\uC815\uC131 \uC911\uC2DC",
      "\uC678\uAD6D\uC778 \uACE0\uAC1D \uB300\uC751 \uC704\uD55C \uB2E4\uAD6D\uC5B4 UI \uD544\uC218",
      "\uB192\uC740 \uB9E4\uCD9C\uB85C \uC778\uD55C \uC218\uC218\uB8CC \uC808\uC57D \uD6A8\uACFC \uADF9\uB300\uD654 \uAC00\uB2A5"
    ],
    featuredDistricts: [
      { name: "\uAC15\uB0A8\uAD6C", description: "\uB300\uAE30\uC5C5 \uBC00\uC9D1\xB7\uACE0\uAE09 \uC0C1\uAD8C, \uD504\uB9AC\uBBF8\uC5C4 POS\xB7\uD0A4\uC624\uC2A4\uD06C \uC218\uC694 \uB192\uC74C" },
      { name: "\uB9C8\uD3EC\uAD6C", description: "\uD64D\uB300 \uC0C1\uAD8C\xB7\uCCAD\uB144 \uCC3D\uC5C5, \uD14C\uC774\uBE14\uC624\uB354\xB7SNS \uC5F0\uB3D9 \uC194\uB8E8\uC158 \uC778\uAE30" },
      { name: "\uC911\uAD6C", description: "\uBA85\uB3D9\xB7\uB3D9\uB300\uBB38 \uAD00\uAD11\uD2B9\uAD6C, \uB2E4\uAD6D\uC5B4 \uC9C0\uC6D0\xB7\uBA74\uC138 \uC5F0\uB3D9 \uD544\uC218" },
      { name: "\uC6A9\uC0B0\uAD6C", description: "IT\xB7\uC804\uC790\uC0C1\uAC00 \uBC00\uC9D1, \uCD5C\uC2E0 \uAE30\uC220 \uC7A5\uBE44\uC5D0 \uB300\uD55C \uAD00\uC2EC\uB3C4 \uB192\uC74C" }
    ]
  },
  {
    code: "gyeonggi",
    nameKo: "\uACBD\uAE30\uB3C4",
    nameKoShort: "\uACBD\uAE30",
    nameEn: "Gyeonggi",
    districts: [
    { slug: "이천시", name: "이천시", nameEn: "", dongs: [
      { slug: "관고동", name: "관고동" },
      { slug: "중리동", name: "중리동" },
      { slug: "증일동", name: "증일동" },
      { slug: "단월동", name: "단월동" },
      { slug: "대포동", name: "대포동" },
      { slug: "갈산동", name: "갈산동" },
      { slug: "증포동", name: "증포동" },
      { slug: "송정동", name: "송정동" },
      { slug: "사음동", name: "사음동" },
      { slug: "설성면", name: "설성면" },
      { slug: "대월면", name: "대월면" },
      { slug: "부발읍", name: "부발읍" },
      { slug: "백사면", name: "백사면" },
      { slug: "율면", name: "율면" },
      { slug: "모가면", name: "모가면" },
      { slug: "호법면", name: "호법면" },
      { slug: "고담동", name: "고담동" },
      { slug: "장록동", name: "장록동" },
      { slug: "장호원읍", name: "장호원읍" },
      { slug: "마장면", name: "마장면" },
      { slug: "율현동", name: "율현동" },
      { slug: "진리동", name: "진리동" },
      { slug: "안흥동", name: "안흥동" },
      { slug: "이천시", name: "이천시" },
      { slug: "창전동", name: "창전동" },
      { slug: "신둔면", name: "신둔면" }
    ] },
    { slug: "양주시", name: "양주시", nameEn: "", dongs: [
      { slug: "양주시", name: "양주시" },
      { slug: "유양동", name: "유양동" },
      { slug: "어둔동", name: "어둔동" },
      { slug: "산북동", name: "산북동" },
      { slug: "광사동", name: "광사동" },
      { slug: "남방동", name: "남방동" },
      { slug: "마전동", name: "마전동" },
      { slug: "장흥면", name: "장흥면" },
      { slug: "옥정동", name: "옥정동" },
      { slug: "덕계동", name: "덕계동" },
      { slug: "회정동", name: "회정동" },
      { slug: "백석읍", name: "백석읍" },
      { slug: "남면", name: "남면" },
      { slug: "만송동", name: "만송동" },
      { slug: "삼숭동", name: "삼숭동" },
      { slug: "고읍동", name: "고읍동" },
      { slug: "덕정동", name: "덕정동" },
      { slug: "봉양동", name: "봉양동" },
      { slug: "은현면", name: "은현면" },
      { slug: "회암동", name: "회암동" },
      { slug: "율정동", name: "율정동" },
      { slug: "고암동", name: "고암동" },
      { slug: "광적면", name: "광적면" }
    ] },
    { slug: "구리시", name: "구리시", nameEn: "", dongs: [
      { slug: "토평동", name: "토평동" },
      { slug: "구리시", name: "구리시" },
      { slug: "수택동", name: "수택동" },
      { slug: "아천동", name: "아천동" },
      { slug: "갈매동", name: "갈매동" },
      { slug: "사노동", name: "사노동" },
      { slug: "인창동", name: "인창동" },
      { slug: "교문동", name: "교문동" }
    ] },
    { slug: "양평군", name: "양평군", nameEn: "", dongs: [
      { slug: "지평면", name: "지평면" },
      { slug: "용문면", name: "용문면" },
      { slug: "단월면", name: "단월면" },
      { slug: "옥천면", name: "옥천면" },
      { slug: "서종면", name: "서종면" },
      { slug: "강하면", name: "강하면" },
      { slug: "양평군", name: "양평군" },
      { slug: "양평읍", name: "양평읍" },
      { slug: "청운면", name: "청운면" },
      { slug: "양동면", name: "양동면" },
      { slug: "개군면", name: "개군면" },
      { slug: "양서면", name: "양서면" },
      { slug: "강상면", name: "강상면" }
    ] },
    { slug: "여주시", name: "여주시", nameEn: "", dongs: [
      { slug: "대신면", name: "대신면" },
      { slug: "하동", name: "하동" },
      { slug: "상동", name: "상동" },
      { slug: "홍문동", name: "홍문동" },
      { slug: "교동", name: "교동" },
      { slug: "월송동", name: "월송동" },
      { slug: "우만동", name: "우만동" },
      { slug: "오금동", name: "오금동" },
      { slug: "가남읍", name: "가남읍" },
      { slug: "가업동", name: "가업동" },
      { slug: "연라동", name: "연라동" },
      { slug: "상거동", name: "상거동" },
      { slug: "하거동", name: "하거동" },
      { slug: "삼교동", name: "삼교동" },
      { slug: "점봉동", name: "점봉동" },
      { slug: "능현동", name: "능현동" },
      { slug: "멱곡동", name: "멱곡동" },
      { slug: "세종대왕면", name: "세종대왕면" },
      { slug: "연양동", name: "연양동" },
      { slug: "매룡동", name: "매룡동" },
      { slug: "천송동", name: "천송동" },
      { slug: "오학동", name: "오학동" },
      { slug: "창동", name: "창동" },
      { slug: "여주시", name: "여주시" },
      { slug: "북내면", name: "북내면" },
      { slug: "산북면", name: "산북면" },
      { slug: "강천면", name: "강천면" },
      { slug: "흥천면", name: "흥천면" },
      { slug: "점동면", name: "점동면" },
      { slug: "단현동", name: "단현동" },
      { slug: "신진동", name: "신진동" },
      { slug: "금사면", name: "금사면" },
      { slug: "현암동", name: "현암동" },
      { slug: "능서면", name: "능서면" }
    ] },
    { slug: "파주시", name: "파주시", nameEn: "", dongs: [
      { slug: "교하동", name: "교하동" },
      { slug: "야당동", name: "야당동" },
      { slug: "다율동", name: "다율동" },
      { slug: "오도동", name: "오도동" },
      { slug: "상지석동", name: "상지석동" },
      { slug: "산남동", name: "산남동" },
      { slug: "동패동", name: "동패동" },
      { slug: "광탄면", name: "광탄면" },
      { slug: "장단면", name: "장단면" },
      { slug: "진동면", name: "진동면" },
      { slug: "군내면", name: "군내면" },
      { slug: "금촌동", name: "금촌동" },
      { slug: "아동동", name: "아동동" },
      { slug: "문발동", name: "문발동" },
      { slug: "송촌동", name: "송촌동" },
      { slug: "목동동", name: "목동동" },
      { slug: "하지석동", name: "하지석동" },
      { slug: "당하동", name: "당하동" },
      { slug: "적성면", name: "적성면" },
      { slug: "탄현면", name: "탄현면" },
      { slug: "야동동", name: "야동동" },
      { slug: "검산동", name: "검산동" },
      { slug: "맥금동", name: "맥금동" },
      { slug: "파평면", name: "파평면" },
      { slug: "금릉동", name: "금릉동" },
      { slug: "문산읍", name: "문산읍" },
      { slug: "파주시", name: "파주시" },
      { slug: "조리읍", name: "조리읍" },
      { slug: "법원읍", name: "법원읍" },
      { slug: "진서면", name: "진서면" },
      { slug: "서패동", name: "서패동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "파주읍", name: "파주읍" },
      { slug: "연다산동", name: "연다산동" },
      { slug: "와동동", name: "와동동" },
      { slug: "월롱면", name: "월롱면" }
    ] },
    { slug: "고양시 덕양구", name: "고양시 덕양구", nameEn: "", dongs: [
      { slug: "삼송동", name: "삼송동" },
      { slug: "내곡동", name: "내곡동" },
      { slug: "대장동", name: "대장동" },
      { slug: "화정동", name: "화정동" },
      { slug: "선유동", name: "선유동" },
      { slug: "고양동", name: "고양동" },
      { slug: "행신동", name: "행신동" },
      { slug: "강매동", name: "강매동" },
      { slug: "행주내동", name: "행주내동" },
      { slug: "행주외동", name: "행주외동" },
      { slug: "신평동", name: "신평동" },
      { slug: "원흥동", name: "원흥동" },
      { slug: "지축동", name: "지축동" },
      { slug: "신원동", name: "신원동" },
      { slug: "화전동", name: "화전동" },
      { slug: "도내동", name: "도내동" },
      { slug: "성사동", name: "성사동" },
      { slug: "대자동", name: "대자동" },
      { slug: "관산동", name: "관산동" },
      { slug: "내유동", name: "내유동" },
      { slug: "원당동", name: "원당동" },
      { slug: "벽제동", name: "벽제동" },
      { slug: "고양시 덕양구", name: "고양시 덕양구" },
      { slug: "주교동", name: "주교동" },
      { slug: "북한동", name: "북한동" },
      { slug: "효자동", name: "효자동" },
      { slug: "현천동", name: "현천동" },
      { slug: "덕은동", name: "덕은동" },
      { slug: "향동동", name: "향동동" },
      { slug: "토당동", name: "토당동" },
      { slug: "오금동", name: "오금동" },
      { slug: "동산동", name: "동산동" },
      { slug: "용두동", name: "용두동" },
      { slug: "고양시덕양구", name: "고양시덕양구" }
    ] },
    { slug: "의정부시", name: "의정부시", nameEn: "", dongs: [
      { slug: "민락동", name: "민락동" },
      { slug: "의정부시", name: "의정부시" },
      { slug: "낙양동", name: "낙양동" },
      { slug: "신곡동", name: "신곡동" },
      { slug: "자일동", name: "자일동" },
      { slug: "금오동", name: "금오동" },
      { slug: "가능동", name: "가능동" },
      { slug: "용현동", name: "용현동" },
      { slug: "의정부동", name: "의정부동" },
      { slug: "호원동", name: "호원동" },
      { slug: "녹양동", name: "녹양동" },
      { slug: "고산동", name: "고산동" },
      { slug: "산곡동", name: "산곡동" },
      { slug: "장암동", name: "장암동" }
    ] },
    { slug: "화성시", name: "화성시", nameEn: "", dongs: [
      { slug: "매송면", name: "매송면" },
      { slug: "비봉면", name: "비봉면" },
      { slug: "중동", name: "중동" },
      { slug: "신동", name: "신동" },
      { slug: "목동", name: "목동" },
      { slug: "산척동", name: "산척동" },
      { slug: "장지동", name: "장지동" },
      { slug: "송동", name: "송동" },
      { slug: "방교동", name: "방교동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "새솔동", name: "새솔동" },
      { slug: "봉담읍", name: "봉담읍" },
      { slug: "오산동", name: "오산동" },
      { slug: "청계동", name: "청계동" },
      { slug: "장안면", name: "장안면" },
      { slug: "정남면", name: "정남면" },
      { slug: "마도면", name: "마도면" },
      { slug: "반월동", name: "반월동" },
      { slug: "기안동", name: "기안동" },
      { slug: "우정읍", name: "우정읍" },
      { slug: "반정동", name: "반정동" },
      { slug: "송산면", name: "송산면" },
      { slug: "양감면", name: "양감면" },
      { slug: "송산동", name: "송산동" },
      { slug: "안녕동", name: "안녕동" },
      { slug: "반송동", name: "반송동" },
      { slug: "석우동", name: "석우동" },
      { slug: "향남읍", name: "향남읍" },
      { slug: "영천동", name: "영천동" },
      { slug: "서신면", name: "서신면" },
      { slug: "배양동", name: "배양동" },
      { slug: "남양읍", name: "남양읍" },
      { slug: "화성시", name: "화성시" },
      { slug: "진안동", name: "진안동" },
      { slug: "병점동", name: "병점동" },
      { slug: "능동", name: "능동" },
      { slug: "기산동", name: "기산동" },
      { slug: "황계동", name: "황계동" },
      { slug: "팔탄면", name: "팔탄면" },
      { slug: "동탄면", name: "동탄면" },
      { slug: "남양동", name: "남양동" },
      { slug: "신남동", name: "신남동" },
      { slug: "장덕동", name: "장덕동" },
      { slug: "안석동", name: "안석동" },
      { slug: "활초동", name: "활초동" },
      { slug: "온석동", name: "온석동" },
      { slug: "무송동", name: "무송동" },
      { slug: "북양동", name: "북양동" },
      { slug: "송림동", name: "송림동" },
      { slug: "수화동", name: "수화동" },
      { slug: "장전동", name: "장전동" },
      { slug: "신외동", name: "신외동" },
      { slug: "문호동", name: "문호동" },
      { slug: "시동", name: "시동" },
      { slug: "원천동", name: "원천동" }
    ] },
    { slug: "안산시 상록구", name: "안산시 상록구", nameEn: "", dongs: [
      { slug: "양상동", name: "양상동" },
      { slug: "성포동", name: "성포동" },
      { slug: "월피동", name: "월피동" },
      { slug: "팔곡일동", name: "팔곡일동" },
      { slug: "건건동", name: "건건동" },
      { slug: "사사동", name: "사사동" },
      { slug: "팔곡이동", name: "팔곡이동" },
      { slug: "부곡동", name: "부곡동" },
      { slug: "본오동", name: "본오동" },
      { slug: "사동", name: "사동" },
      { slug: "안산시상록구", name: "안산시상록구" },
      { slug: "일동", name: "일동" },
      { slug: "이동", name: "이동" },
      { slug: "장하동", name: "장하동" },
      { slug: "수암동", name: "수암동" },
      { slug: "장상동", name: "장상동" }
    ] },
    { slug: "수원시 팔달구", name: "수원시 팔달구", nameEn: "", dongs: [
      { slug: "구천동", name: "구천동" },
      { slug: "우만동", name: "우만동" },
      { slug: "고등동", name: "고등동" },
      { slug: "교동", name: "교동" },
      { slug: "매교동", name: "매교동" },
      { slug: "매산로1가", name: "매산로1가" },
      { slug: "매산로2가", name: "매산로2가" },
      { slug: "매산로3가", name: "매산로3가" },
      { slug: "팔달로3가", name: "팔달로3가" },
      { slug: "남수동", name: "남수동" },
      { slug: "매향동", name: "매향동" },
      { slug: "지동", name: "지동" },
      { slug: "북수동", name: "북수동" },
      { slug: "신풍동", name: "신풍동" },
      { slug: "장안동", name: "장안동" },
      { slug: "화서동", name: "화서동" },
      { slug: "영동", name: "영동" },
      { slug: "중동", name: "중동" },
      { slug: "수원시팔달구", name: "수원시팔달구" },
      { slug: "팔달로1가", name: "팔달로1가" },
      { slug: "팔달로2가", name: "팔달로2가" },
      { slug: "남창동", name: "남창동" },
      { slug: "인계동", name: "인계동" }
    ] },
    { slug: "평택시", name: "평택시", nameEn: "", dongs: [
      { slug: "월곡동", name: "월곡동" },
      { slug: "청룡동", name: "청룡동" },
      { slug: "죽백동", name: "죽백동" },
      { slug: "고덕면", name: "고덕면" },
      { slug: "평택시", name: "평택시" },
      { slug: "진위면", name: "진위면" },
      { slug: "가재동", name: "가재동" },
      { slug: "장안동", name: "장안동" },
      { slug: "포승읍", name: "포승읍" },
      { slug: "통복동", name: "통복동" },
      { slug: "용이동", name: "용이동" },
      { slug: "동삭동", name: "동삭동" },
      { slug: "세교동", name: "세교동" },
      { slug: "지제동", name: "지제동" },
      { slug: "비전동", name: "비전동" },
      { slug: "안중읍", name: "안중읍" },
      { slug: "군문동", name: "군문동" },
      { slug: "유천동", name: "유천동" },
      { slug: "서탄면", name: "서탄면" },
      { slug: "이충동", name: "이충동" },
      { slug: "지산동", name: "지산동" },
      { slug: "독곡동", name: "독곡동" },
      { slug: "신장동", name: "신장동" },
      { slug: "평택동", name: "평택동" },
      { slug: "합정동", name: "합정동" },
      { slug: "신대동", name: "신대동" },
      { slug: "소사동", name: "소사동" },
      { slug: "칠원동", name: "칠원동" },
      { slug: "오성면", name: "오성면" },
      { slug: "청북읍", name: "청북읍" },
      { slug: "현덕면", name: "현덕면" },
      { slug: "팽성읍", name: "팽성읍" },
      { slug: "서정동", name: "서정동" },
      { slug: "장당동", name: "장당동" },
      { slug: "모곡동", name: "모곡동" },
      { slug: "칠괴동", name: "칠괴동" },
      { slug: "도일동", name: "도일동" },
      { slug: "고덕동", name: "고덕동" },
      { slug: "청북면", name: "청북면" }
    ] },
    { slug: "용인시 기흥구", name: "용인시 기흥구", nameEn: "", dongs: [
      { slug: "영덕동", name: "영덕동" },
      { slug: "언남동", name: "언남동" },
      { slug: "마북동", name: "마북동" },
      { slug: "청덕동", name: "청덕동" },
      { slug: "동백동", name: "동백동" },
      { slug: "중동", name: "중동" },
      { slug: "상하동", name: "상하동" },
      { slug: "보정동", name: "보정동" },
      { slug: "보라동", name: "보라동" },
      { slug: "지곡동", name: "지곡동" },
      { slug: "공세동", name: "공세동" },
      { slug: "고매동", name: "고매동" },
      { slug: "신갈동", name: "신갈동" },
      { slug: "구갈동", name: "구갈동" },
      { slug: "상갈동", name: "상갈동" },
      { slug: "농서동", name: "농서동" },
      { slug: "하갈동", name: "하갈동" },
      { slug: "서천동", name: "서천동" },
      { slug: "용인시기흥구", name: "용인시기흥구" }
    ] },
    { slug: "가평군", name: "가평군", nameEn: "", dongs: [
      { slug: "설악면", name: "설악면" },
      { slug: "가평군", name: "가평군" },
      { slug: "가평읍", name: "가평읍" },
      { slug: "북면", name: "북면" },
      { slug: "조종면", name: "조종면" },
      { slug: "상면", name: "상면" },
      { slug: "청평면", name: "청평면" },
      { slug: "하면", name: "하면" }
    ] },
    { slug: "용인시 수지구", name: "용인시 수지구", nameEn: "", dongs: [
      { slug: "용인시수지구", name: "용인시수지구" },
      { slug: "풍덕천동", name: "풍덕천동" },
      { slug: "죽전동", name: "죽전동" },
      { slug: "상현동", name: "상현동" },
      { slug: "동천동", name: "동천동" },
      { slug: "고기동", name: "고기동" },
      { slug: "신봉동", name: "신봉동" },
      { slug: "성복동", name: "성복동" }
    ] },
    { slug: "김포시", name: "김포시", nameEn: "", dongs: [
      { slug: "하성면", name: "하성면" },
      { slug: "대곶면", name: "대곶면" },
      { slug: "김포시", name: "김포시" },
      { slug: "통진읍", name: "통진읍" },
      { slug: "감정동", name: "감정동" },
      { slug: "월곶면", name: "월곶면" },
      { slug: "고촌읍", name: "고촌읍" },
      { slug: "양촌읍", name: "양촌읍" },
      { slug: "사우동", name: "사우동" },
      { slug: "풍무동", name: "풍무동" },
      { slug: "마산동", name: "마산동" },
      { slug: "구래동", name: "구래동" },
      { slug: "북변동", name: "북변동" },
      { slug: "걸포동", name: "걸포동" },
      { slug: "운양동", name: "운양동" },
      { slug: "장기동", name: "장기동" }
    ] },
    { slug: "남양주시", name: "남양주시", nameEn: "", dongs: [
      { slug: "별내동", name: "별내동" },
      { slug: "다산동", name: "다산동" },
      { slug: "조안면", name: "조안면" },
      { slug: "수석동", name: "수석동" },
      { slug: "남양주시", name: "남양주시" },
      { slug: "호평동", name: "호평동" },
      { slug: "평내동", name: "평내동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "와부읍", name: "와부읍" },
      { slug: "진접읍", name: "진접읍" },
      { slug: "지금동", name: "지금동" },
      { slug: "도농동", name: "도농동" },
      { slug: "별내면", name: "별내면" },
      { slug: "진건읍", name: "진건읍" },
      { slug: "오남읍", name: "오남읍" },
      { slug: "퇴계원읍", name: "퇴계원읍" },
      { slug: "일패동", name: "일패동" },
      { slug: "이패동", name: "이패동" },
      { slug: "삼패동", name: "삼패동" },
      { slug: "수동면", name: "수동면" },
      { slug: "화도읍", name: "화도읍" },
      { slug: "퇴계원면", name: "퇴계원면" },
      { slug: "가운동", name: "가운동" }
    ] },
    { slug: "시흥시", name: "시흥시", nameEn: "", dongs: [
      { slug: "장현동", name: "장현동" },
      { slug: "매화동", name: "매화동" },
      { slug: "도창동", name: "도창동" },
      { slug: "금이동", name: "금이동" },
      { slug: "과림동", name: "과림동" },
      { slug: "배곧동", name: "배곧동" },
      { slug: "신천동", name: "신천동" },
      { slug: "방산동", name: "방산동" },
      { slug: "포동", name: "포동" },
      { slug: "미산동", name: "미산동" },
      { slug: "은행동", name: "은행동" },
      { slug: "시흥시", name: "시흥시" },
      { slug: "대야동", name: "대야동" },
      { slug: "죽율동", name: "죽율동" },
      { slug: "물왕동", name: "물왕동" },
      { slug: "산현동", name: "산현동" },
      { slug: "조남동", name: "조남동" },
      { slug: "논곡동", name: "논곡동" },
      { slug: "목감동", name: "목감동" },
      { slug: "거모동", name: "거모동" },
      { slug: "군자동", name: "군자동" },
      { slug: "정왕동", name: "정왕동" },
      { slug: "장곡동", name: "장곡동" },
      { slug: "월곶동", name: "월곶동" },
      { slug: "능곡동", name: "능곡동" },
      { slug: "하중동", name: "하중동" },
      { slug: "하상동", name: "하상동" },
      { slug: "광석동", name: "광석동" },
      { slug: "안현동", name: "안현동" },
      { slug: "무지내동", name: "무지내동" },
      { slug: "계수동", name: "계수동" },
      { slug: "화정동", name: "화정동" }
    ] },
    { slug: "용인시 처인구", name: "용인시 처인구", nameEn: "", dongs: [
      { slug: "백암면", name: "백암면" },
      { slug: "원삼면", name: "원삼면" },
      { slug: "양지면", name: "양지면" },
      { slug: "남사읍", name: "남사읍" },
      { slug: "유방동", name: "유방동" },
      { slug: "고림동", name: "고림동" },
      { slug: "마평동", name: "마평동" },
      { slug: "역북동", name: "역북동" },
      { slug: "남동", name: "남동" },
      { slug: "호동", name: "호동" },
      { slug: "해곡동", name: "해곡동" },
      { slug: "모현읍", name: "모현읍" },
      { slug: "용인시처인구", name: "용인시처인구" },
      { slug: "김량장동", name: "김량장동" },
      { slug: "삼가동", name: "삼가동" },
      { slug: "포곡읍", name: "포곡읍" },
      { slug: "운학동", name: "운학동" },
      { slug: "이동읍", name: "이동읍" },
      { slug: "남사면", name: "남사면" },
      { slug: "모현면", name: "모현면" },
      { slug: "이동면", name: "이동면" }
    ] },
    { slug: "의왕시", name: "의왕시", nameEn: "", dongs: [
      { slug: "의왕시", name: "의왕시" },
      { slug: "고천동", name: "고천동" },
      { slug: "오전동", name: "오전동" },
      { slug: "학의동", name: "학의동" },
      { slug: "내손동", name: "내손동" },
      { slug: "월암동", name: "월암동" },
      { slug: "초평동", name: "초평동" },
      { slug: "청계동", name: "청계동" },
      { slug: "포일동", name: "포일동" },
      { slug: "이동", name: "이동" },
      { slug: "삼동", name: "삼동" },
      { slug: "왕곡동", name: "왕곡동" }
    ] },
    { slug: "오산시", name: "오산시", nameEn: "", dongs: [
      { slug: "갈곶동", name: "갈곶동" },
      { slug: "내삼미동", name: "내삼미동" },
      { slug: "수청동", name: "수청동" },
      { slug: "궐동", name: "궐동" },
      { slug: "외삼미동", name: "외삼미동" },
      { slug: "양산동", name: "양산동" },
      { slug: "세교동", name: "세교동" },
      { slug: "지곶동", name: "지곶동" },
      { slug: "서랑동", name: "서랑동" },
      { slug: "서동", name: "서동" },
      { slug: "벌음동", name: "벌음동" },
      { slug: "두곡동", name: "두곡동" },
      { slug: "탑동", name: "탑동" },
      { slug: "오산동", name: "오산동" },
      { slug: "원동", name: "원동" },
      { slug: "고현동", name: "고현동" },
      { slug: "은계동", name: "은계동" },
      { slug: "청학동", name: "청학동" },
      { slug: "가장동", name: "가장동" },
      { slug: "금암동", name: "금암동" },
      { slug: "가수동", name: "가수동" },
      { slug: "청호동", name: "청호동" },
      { slug: "오산시", name: "오산시" },
      { slug: "부산동", name: "부산동" },
      { slug: "누읍동", name: "누읍동" }
    ] },
    { slug: "부천시 원미구", name: "부천시 원미구", nameEn: "", dongs: [
      { slug: "심곡동", name: "심곡동" },
      { slug: "상동", name: "상동" },
      { slug: "원미동", name: "원미동" },
      { slug: "춘의동", name: "춘의동" },
      { slug: "도당동", name: "도당동" },
      { slug: "약대동", name: "약대동" },
      { slug: "소사동", name: "소사동" },
      { slug: "역곡동", name: "역곡동" },
      { slug: "중동", name: "중동" },
      { slug: "부천시 원미구", name: "부천시 원미구" },
      { slug: "부천시원미구", name: "부천시원미구" }
    ] },
    { slug: "성남시 중원구", name: "성남시 중원구", nameEn: "", dongs: [
      { slug: "은행동", name: "은행동" },
      { slug: "금광동", name: "금광동" },
      { slug: "상대원동", name: "상대원동" },
      { slug: "성남동", name: "성남동" },
      { slug: "여수동", name: "여수동" },
      { slug: "도촌동", name: "도촌동" },
      { slug: "성남시중원구", name: "성남시중원구" },
      { slug: "갈현동", name: "갈현동" },
      { slug: "하대원동", name: "하대원동" },
      { slug: "중앙동", name: "중앙동" }
    ] },
    { slug: "과천시", name: "과천시", nameEn: "", dongs: [
      { slug: "갈현동", name: "갈현동" },
      { slug: "막계동", name: "막계동" },
      { slug: "과천동", name: "과천동" },
      { slug: "문원동", name: "문원동" },
      { slug: "부림동", name: "부림동" },
      { slug: "주암동", name: "주암동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "원문동", name: "원문동" },
      { slug: "별양동", name: "별양동" },
      { slug: "과천시", name: "과천시" },
      { slug: "관문동", name: "관문동" }
    ] },
    { slug: "포천시", name: "포천시", nameEn: "", dongs: [
      { slug: "화현면", name: "화현면" },
      { slug: "관인면", name: "관인면" },
      { slug: "창수면", name: "창수면" },
      { slug: "군내면", name: "군내면" },
      { slug: "영북면", name: "영북면" },
      { slug: "포천시", name: "포천시" },
      { slug: "신읍동", name: "신읍동" },
      { slug: "어룡동", name: "어룡동" },
      { slug: "자작동", name: "자작동" },
      { slug: "선단동", name: "선단동" },
      { slug: "이동면", name: "이동면" },
      { slug: "신북면", name: "신북면" },
      { slug: "영중면", name: "영중면" },
      { slug: "설운동", name: "설운동" },
      { slug: "동교동", name: "동교동" },
      { slug: "소흘읍", name: "소흘읍" },
      { slug: "내촌면", name: "내촌면" },
      { slug: "일동면", name: "일동면" },
      { slug: "가산면", name: "가산면" }
    ] },
    { slug: "수원시 영통구", name: "수원시 영통구", nameEn: "", dongs: [
      { slug: "망포동", name: "망포동" },
      { slug: "하동", name: "하동" },
      { slug: "영통동", name: "영통동" },
      { slug: "신동", name: "신동" },
      { slug: "수원시영통구", name: "수원시영통구" },
      { slug: "매탄동", name: "매탄동" },
      { slug: "원천동", name: "원천동" },
      { slug: "이의동", name: "이의동" }
    ] },
    { slug: "성남시", name: "성남시", nameEn: "", dongs: [
      { slug: "성남시", name: "성남시" }
    ] },
    { slug: "성남시 수정구", name: "성남시 수정구", nameEn: "", dongs: [
      { slug: "성남시수정구", name: "성남시수정구" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "태평동", name: "태평동" },
      { slug: "수진동", name: "수진동" },
      { slug: "단대동", name: "단대동" },
      { slug: "산성동", name: "산성동" },
      { slug: "양지동", name: "양지동" },
      { slug: "복정동", name: "복정동" },
      { slug: "창곡동", name: "창곡동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "오야동", name: "오야동" },
      { slug: "심곡동", name: "심곡동" },
      { slug: "고등동", name: "고등동" },
      { slug: "상적동", name: "상적동" },
      { slug: "둔전동", name: "둔전동" },
      { slug: "시흥동", name: "시흥동" },
      { slug: "금토동", name: "금토동" },
      { slug: "사송동", name: "사송동" }
    ] },
    { slug: "광주시", name: "광주시", nameEn: "", dongs: [
      { slug: "초월읍", name: "초월읍" },
      { slug: "광주시", name: "광주시" },
      { slug: "태전동", name: "태전동" },
      { slug: "회덕동", name: "회덕동" },
      { slug: "목현동", name: "목현동" },
      { slug: "삼동", name: "삼동" },
      { slug: "중대동", name: "중대동" },
      { slug: "직동", name: "직동" },
      { slug: "장지동", name: "장지동" },
      { slug: "역동", name: "역동" },
      { slug: "목동", name: "목동" },
      { slug: "쌍령동", name: "쌍령동" },
      { slug: "송정동", name: "송정동" },
      { slug: "탄벌동", name: "탄벌동" },
      { slug: "남종면", name: "남종면" },
      { slug: "오포읍", name: "오포읍" },
      { slug: "퇴촌면", name: "퇴촌면" },
      { slug: "곤지암읍", name: "곤지암읍" },
      { slug: "도척면", name: "도척면" },
      { slug: "남한산성면", name: "남한산성면" },
      { slug: "경안동", name: "경안동" },
      { slug: "능평동", name: "능평동" },
      { slug: "문형동", name: "문형동" },
      { slug: "추자동", name: "추자동" },
      { slug: "양벌동", name: "양벌동" },
      { slug: "매산동", name: "매산동" },
      { slug: "고산동", name: "고산동" },
      { slug: "신현동", name: "신현동" },
      { slug: "중부면", name: "중부면" }
    ] },
    { slug: "동두천시", name: "동두천시", nameEn: "", dongs: [
      { slug: "광암동", name: "광암동" },
      { slug: "동두천시", name: "동두천시" },
      { slug: "송내동", name: "송내동" },
      { slug: "걸산동", name: "걸산동" },
      { slug: "보산동", name: "보산동" },
      { slug: "동두천동", name: "동두천동" },
      { slug: "탑동동", name: "탑동동" },
      { slug: "상패동", name: "상패동" },
      { slug: "하봉암동", name: "하봉암동" },
      { slug: "안흥동", name: "안흥동" },
      { slug: "상봉암동", name: "상봉암동" },
      { slug: "지행동", name: "지행동" },
      { slug: "생연동", name: "생연동" }
    ] },
    { slug: "성남시 분당구", name: "성남시 분당구", nameEn: "", dongs: [
      { slug: "분당동", name: "분당동" },
      { slug: "수내동", name: "수내동" },
      { slug: "서현동", name: "서현동" },
      { slug: "이매동", name: "이매동" },
      { slug: "동원동", name: "동원동" },
      { slug: "구미동", name: "구미동" },
      { slug: "운중동", name: "운중동" },
      { slug: "대장동", name: "대장동" },
      { slug: "석운동", name: "석운동" },
      { slug: "하산운동", name: "하산운동" },
      { slug: "정자동", name: "정자동" },
      { slug: "율동", name: "율동" },
      { slug: "야탑동", name: "야탑동" },
      { slug: "판교동", name: "판교동" },
      { slug: "삼평동", name: "삼평동" },
      { slug: "백현동", name: "백현동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "궁내동", name: "궁내동" },
      { slug: "성남시분당구", name: "성남시분당구" }
    ] },
    { slug: "하남시", name: "하남시", nameEn: "", dongs: [
      { slug: "망월동", name: "망월동" },
      { slug: "풍산동", name: "풍산동" },
      { slug: "미사동", name: "미사동" },
      { slug: "감이동", name: "감이동" },
      { slug: "항동", name: "항동" },
      { slug: "초일동", name: "초일동" },
      { slug: "상산곡동", name: "상산곡동" },
      { slug: "신장동", name: "신장동" },
      { slug: "덕풍동", name: "덕풍동" },
      { slug: "감북동", name: "감북동" },
      { slug: "감일동", name: "감일동" },
      { slug: "춘궁동", name: "춘궁동" },
      { slug: "하사창동", name: "하사창동" },
      { slug: "상사창동", name: "상사창동" },
      { slug: "선동", name: "선동" },
      { slug: "당정동", name: "당정동" },
      { slug: "학암동", name: "학암동" },
      { slug: "교산동", name: "교산동" },
      { slug: "하남시", name: "하남시" },
      { slug: "천현동", name: "천현동" },
      { slug: "하산곡동", name: "하산곡동" },
      { slug: "창우동", name: "창우동" },
      { slug: "배알미동", name: "배알미동" },
      { slug: "초이동", name: "초이동" },
      { slug: "광암동", name: "광암동" }
    ] },
    { slug: "수원시 권선구", name: "수원시 권선구", nameEn: "", dongs: [
      { slug: "세류동", name: "세류동" },
      { slug: "평동", name: "평동" },
      { slug: "고색동", name: "고색동" },
      { slug: "오목천동", name: "오목천동" },
      { slug: "구운동", name: "구운동" },
      { slug: "탑동", name: "탑동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "호매실동", name: "호매실동" },
      { slug: "곡반정동", name: "곡반정동" },
      { slug: "권선동", name: "권선동" },
      { slug: "장지동", name: "장지동" },
      { slug: "대황교동", name: "대황교동" },
      { slug: "입북동", name: "입북동" },
      { slug: "당수동", name: "당수동" },
      { slug: "평리동", name: "평리동" },
      { slug: "서둔동", name: "서둔동" },
      { slug: "수원시권선구", name: "수원시권선구" }
    ] },
    { slug: "고양시 일산동구", name: "고양시 일산동구", nameEn: "", dongs: [
      { slug: "성석동", name: "성석동" },
      { slug: "정발산동", name: "정발산동" },
      { slug: "장항동", name: "장항동" },
      { slug: "문봉동", name: "문봉동" },
      { slug: "지영동", name: "지영동" },
      { slug: "설문동", name: "설문동" },
      { slug: "백석동", name: "백석동" },
      { slug: "풍동", name: "풍동" },
      { slug: "산황동", name: "산황동" },
      { slug: "사리현동", name: "사리현동" },
      { slug: "마두동", name: "마두동" },
      { slug: "중산동", name: "중산동" },
      { slug: "고양시일산동구", name: "고양시일산동구" },
      { slug: "식사동", name: "식사동" }
    ] },
    { slug: "안성시", name: "안성시", nameEn: "", dongs: [
      { slug: "보개면", name: "보개면" },
      { slug: "서운면", name: "서운면" },
      { slug: "금광면", name: "금광면" },
      { slug: "서인동", name: "서인동" },
      { slug: "석정동", name: "석정동" },
      { slug: "원곡면", name: "원곡면" },
      { slug: "발화동", name: "발화동" },
      { slug: "중리동", name: "중리동" },
      { slug: "공도읍", name: "공도읍" },
      { slug: "죽산면", name: "죽산면" },
      { slug: "고삼면", name: "고삼면" },
      { slug: "도기동", name: "도기동" },
      { slug: "삼죽면", name: "삼죽면" },
      { slug: "창전동", name: "창전동" },
      { slug: "성남동", name: "성남동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "인지동", name: "인지동" },
      { slug: "금산동", name: "금산동" },
      { slug: "연지동", name: "연지동" },
      { slug: "대천동", name: "대천동" },
      { slug: "양성면", name: "양성면" },
      { slug: "대덕면", name: "대덕면" },
      { slug: "당왕동", name: "당왕동" },
      { slug: "가사동", name: "가사동" },
      { slug: "가현동", name: "가현동" },
      { slug: "옥산동", name: "옥산동" },
      { slug: "사곡동", name: "사곡동" },
      { slug: "계동", name: "계동" },
      { slug: "신건지동", name: "신건지동" },
      { slug: "신소현동", name: "신소현동" },
      { slug: "미양면", name: "미양면" },
      { slug: "일죽면", name: "일죽면" },
      { slug: "아양동", name: "아양동" },
      { slug: "금석동", name: "금석동" },
      { slug: "안성시", name: "안성시" },
      { slug: "봉산동", name: "봉산동" },
      { slug: "숭인동", name: "숭인동" },
      { slug: "영동", name: "영동" },
      { slug: "봉남동", name: "봉남동" },
      { slug: "구포동", name: "구포동" },
      { slug: "동본동", name: "동본동" },
      { slug: "명륜동", name: "명륜동" },
      { slug: "옥천동", name: "옥천동" },
      { slug: "낙원동", name: "낙원동" },
      { slug: "신모산동", name: "신모산동" },
      { slug: "현수동", name: "현수동" }
    ] },
    { slug: "안산시 단원구", name: "안산시 단원구", nameEn: "", dongs: [
      { slug: "선부동", name: "선부동" },
      { slug: "선감동", name: "선감동" },
      { slug: "안산시단원구", name: "안산시단원구" },
      { slug: "고잔동", name: "고잔동" },
      { slug: "와동", name: "와동" },
      { slug: "신길동", name: "신길동" },
      { slug: "성곡동", name: "성곡동" },
      { slug: "원시동", name: "원시동" },
      { slug: "목내동", name: "목내동" },
      { slug: "초지동", name: "초지동" },
      { slug: "대부동동", name: "대부동동" },
      { slug: "대부북동", name: "대부북동" },
      { slug: "대부남동", name: "대부남동" },
      { slug: "풍도동", name: "풍도동" },
      { slug: "화정동", name: "화정동" },
      { slug: "원곡동", name: "원곡동" }
    ] },
    { slug: "연천군", name: "연천군", nameEn: "", dongs: [
      { slug: "장남면", name: "장남면" },
      { slug: "신서면", name: "신서면" },
      { slug: "군남면", name: "군남면" },
      { slug: "백학면", name: "백학면" },
      { slug: "청산면", name: "청산면" },
      { slug: "미산면", name: "미산면" },
      { slug: "연천읍", name: "연천읍" },
      { slug: "연천군", name: "연천군" },
      { slug: "전곡읍", name: "전곡읍" },
      { slug: "중면", name: "중면" },
      { slug: "왕징면", name: "왕징면" }
    ] },
    { slug: "부천시 소사구", name: "부천시 소사구", nameEn: "", dongs: [
      { slug: "소사본동", name: "소사본동" },
      { slug: "심곡본동", name: "심곡본동" },
      { slug: "범박동", name: "범박동" },
      { slug: "송내동", name: "송내동" },
      { slug: "괴안동", name: "괴안동" },
      { slug: "계수동", name: "계수동" },
      { slug: "옥길동", name: "옥길동" },
      { slug: "부천시 소사구", name: "부천시 소사구" },
      { slug: "부천시소사구", name: "부천시소사구" }
    ] },
    { slug: "수원시 장안구", name: "수원시 장안구", nameEn: "", dongs: [
      { slug: "정자동", name: "정자동" },
      { slug: "이목동", name: "이목동" },
      { slug: "율전동", name: "율전동" },
      { slug: "천천동", name: "천천동" },
      { slug: "파장동", name: "파장동" },
      { slug: "수원시장안구", name: "수원시장안구" },
      { slug: "영화동", name: "영화동" },
      { slug: "송죽동", name: "송죽동" },
      { slug: "조원동", name: "조원동" },
      { slug: "연무동", name: "연무동" },
      { slug: "상광교동", name: "상광교동" },
      { slug: "하광교동", name: "하광교동" }
    ] },
    { slug: "광명시", name: "광명시", nameEn: "", dongs: [
      { slug: "철산동", name: "철산동" },
      { slug: "가학동", name: "가학동" },
      { slug: "광명동", name: "광명동" },
      { slug: "옥길동", name: "옥길동" },
      { slug: "광명시", name: "광명시" },
      { slug: "하안동", name: "하안동" },
      { slug: "소하동", name: "소하동" },
      { slug: "노온사동", name: "노온사동" },
      { slug: "일직동", name: "일직동" }
    ] },
    { slug: "안양시 만안구", name: "안양시 만안구", nameEn: "", dongs: [
      { slug: "석수동", name: "석수동" },
      { slug: "박달동", name: "박달동" },
      { slug: "안양시만안구", name: "안양시만안구" },
      { slug: "안양동", name: "안양동" }
    ] },
    { slug: "안양시", name: "안양시", nameEn: "", dongs: [
      { slug: "안양시", name: "안양시" }
    ] },
    { slug: "부천시 오정구", name: "부천시 오정구", nameEn: "", dongs: [
      { slug: "원종동", name: "원종동" },
      { slug: "고강동", name: "고강동" },
      { slug: "대장동", name: "대장동" },
      { slug: "오정동", name: "오정동" },
      { slug: "삼정동", name: "삼정동" },
      { slug: "내동", name: "내동" },
      { slug: "여월동", name: "여월동" },
      { slug: "작동", name: "작동" },
      { slug: "부천시 오정구", name: "부천시 오정구" },
      { slug: "부천시오정구", name: "부천시오정구" }
    ] },
    { slug: "안산시", name: "안산시", nameEn: "", dongs: [
      { slug: "안산시", name: "안산시" }
    ] },
    { slug: "군포시", name: "군포시", nameEn: "", dongs: [
      { slug: "부곡동", name: "부곡동" },
      { slug: "산본동", name: "산본동" },
      { slug: "금정동", name: "금정동" },
      { slug: "둔대동", name: "둔대동" },
      { slug: "속달동", name: "속달동" },
      { slug: "대야미동", name: "대야미동" },
      { slug: "도마교동", name: "도마교동" },
      { slug: "당동", name: "당동" },
      { slug: "당정동", name: "당정동" },
      { slug: "군포시", name: "군포시" }
    ] },
    { slug: "고양시 일산서구", name: "고양시 일산서구", nameEn: "", dongs: [
      { slug: "고양시일산서구", name: "고양시일산서구" },
      { slug: "일산동", name: "일산동" },
      { slug: "탄현동", name: "탄현동" },
      { slug: "주엽동", name: "주엽동" },
      { slug: "대화동", name: "대화동" },
      { slug: "덕이동", name: "덕이동" },
      { slug: "가좌동", name: "가좌동" },
      { slug: "구산동", name: "구산동" },
      { slug: "법곳동", name: "법곳동" }
    ] },
    { slug: "고양시", name: "고양시", nameEn: "", dongs: [
      { slug: "고양시", name: "고양시" }
    ] },
    { slug: "안양시 동안구", name: "안양시 동안구", nameEn: "", dongs: [
      { slug: "호계동", name: "호계동" },
      { slug: "평촌동", name: "평촌동" },
      { slug: "안양동", name: "안양동" },
      { slug: "안양시동안구", name: "안양시동안구" },
      { slug: "비산동", name: "비산동" },
      { slug: "관양동", name: "관양동" }
    ] },
    { slug: "부천시", name: "부천시", nameEn: "", dongs: [
      { slug: "부천시", name: "부천시" },
      { slug: "오정동", name: "오정동" },
      { slug: "여월동", name: "여월동" },
      { slug: "작동", name: "작동" },
      { slug: "원종동", name: "원종동" },
      { slug: "고강동", name: "고강동" },
      { slug: "대장동", name: "대장동" },
      { slug: "원미동", name: "원미동" },
      { slug: "심곡동", name: "심곡동" },
      { slug: "춘의동", name: "춘의동" },
      { slug: "도당동", name: "도당동" },
      { slug: "약대동", name: "약대동" },
      { slug: "소사동", name: "소사동" },
      { slug: "역곡동", name: "역곡동" },
      { slug: "중동", name: "중동" },
      { slug: "상동", name: "상동" },
      { slug: "심곡본동", name: "심곡본동" },
      { slug: "범박동", name: "범박동" },
      { slug: "괴안동", name: "괴안동" },
      { slug: "송내동", name: "송내동" },
      { slug: "옥길동", name: "옥길동" },
      { slug: "계수동", name: "계수동" },
      { slug: "소사본동", name: "소사본동" },
      { slug: "삼정동", name: "삼정동" },
      { slug: "내동", name: "내동" }
    ] },
    { slug: "용인시", name: "용인시", nameEn: "", dongs: [
      { slug: "용인시", name: "용인시" }
    ] },
    { slug: "수원시", name: "수원시", nameEn: "", dongs: [
      { slug: "수원시", name: "수원시" }
    ] },
    { slug: "여주군", name: "여주군", nameEn: "", dongs: [
      { slug: "북내면", name: "북내면" },
      { slug: "강천면", name: "강천면" },
      { slug: "산북면", name: "산북면" },
      { slug: "여주군", name: "여주군" },
      { slug: "여주읍", name: "여주읍" },
      { slug: "흥천면", name: "흥천면" },
      { slug: "점동면", name: "점동면" },
      { slug: "가남면", name: "가남면" },
      { slug: "금사면", name: "금사면" },
      { slug: "능서면", name: "능서면" },
      { slug: "대신면", name: "대신면" }
    ] }
  ],
    districtCount: 31,
    dongCount: 568,
    characteristics: {
      summary: "\uB300\uD615 \uB9E4\uC7A5\uACFC \uC8FC\uCC28 \uC5EC\uC720\uACF5\uAC04\uC774 \uD2B9\uC9D5\uC778 \uC2E0\uB3C4\uC2DC\xB7\uBCA0\uB4DC\uD0C0\uC6B4\uD615 \uC0C1\uAD8C",
      storeTypes: ["\uB300\uD615 \uC2DD\uB2F9\xB7\uCE74\uD398", "\uBE0C\uB79C\uB4DC \uD504\uB79C\uCC28\uC774\uC988", "\uBCF5\uD569 \uC1FC\uD551\uBAB0", "\uD559\uC6D0\xB7\uAD50\uC721\uC2DC\uC124"],
      customerBase: ["\uAC00\uC871 \uB2E8\uC704 \uACE0\uAC1D (60%)", "\uC790\uCC28 \uC774\uC6A9 \uACE0\uAC1D", "\uC8FC\uB9D0 \uC9D1\uC911 \uBC29\uBB38", "\uCCB4\uB958\uC2DC\uAC04 \uC7A5\uAE30"],
      businessHours: "\uC8FC\uC911 \uC624\uD6C4 3-6\uC2DC (\uD559\uC6D0\uAC00), \uC8FC\uB9D0 \uC624\uD6C4 1-8\uC2DC (\uAC00\uC871 \uC678\uC2DD) \uD53C\uD06C"
    },
    businessEnvironment: {
      majorIndustries: ["\uD328\uBC00\uB9AC \uB808\uC2A4\uD1A0\uB791", "\uAD50\uC721\xB7\uD559\uC6D0", "\uC0DD\uD65C \uC11C\uBE44\uC2A4", "\uB300\uD615 \uC18C\uB9E4\uC5C5"],
      commercialAreas: ["\uBD84\uB2F9\xB7\uD310\uAD50", "\uC77C\uC0B0\xB7\uACE0\uC591", "\uC218\uC6D0\xB7\uC601\uD1B5", "\uC548\uC591\xB7\uD3C9\uCD0C"],
      infrastructure: ["\uB113\uC740 \uB9E4\uC7A5 \uBA74\uC801", "\uCDA9\uBD84\uD55C \uC8FC\uCC28\uACF5\uAC04", "\uC2E0\uB3C4\uC2DC \uC778\uD504\uB77C", "\uACE0\uC18D\uB3C4\uB85C \uC811\uADFC\uC131"]
    },
    installationTips: [
      "\uB113\uC740 \uACF5\uAC04 \uD65C\uC6A9\uD55C \uB300\uD615 \uD0A4\uC624\uC2A4\uD06C\xB7\uB514\uC2A4\uD50C\uB808\uC774 \uC124\uCE58 \uAC00\uB2A5",
      "\uC8FC\uCC28\uC7A5 \uC5F0\uACC4\uD55C \uB4DC\uB77C\uC774\uBE0C\uC2A4\uB8E8\xB7\uD53D\uC5C5 \uC194\uB8E8\uC158 \uD6A8\uACFC\uC801",
      "\uAC00\uC871 \uACE0\uAC1D \uBC30\uB824\uD55C \uC811\uADFC\uC131\xB7\uC0AC\uC6A9\uD3B8\uC758\uC131 \uC911\uC2DC",
      "\uBE0C\uB79C\uB4DC \uBCF8\uC0AC \uC5F0\uB3D9 POS\xB7\uC7AC\uACE0\uAD00\uB9AC \uC2DC\uC2A4\uD15C \uC120\uD638"
    ],
    featuredDistricts: [
      { name: "\uC131\uB0A8\uC2DC", description: "\uBD84\uB2F9\xB7\uD310\uAD50 \uD14C\uD06C\uBC38\uB9AC, IT\uAE30\uC5C5 \uC784\uC9C1\uC6D0 \uB300\uC0C1 \uD504\uB9AC\uBBF8\uC5C4 \uC11C\uBE44\uC2A4" },
      { name: "\uACE0\uC591\uC2DC", description: "\uC77C\uC0B0 \uC2E0\uB3C4\uC2DC\xB7\uD0A8\uD14D\uC2A4, \uB300\uADDC\uBAA8 \uD589\uC0AC\xB7\uC804\uC2DC \uAD00\uB828 \uC784\uC2DC \uC124\uCE58 \uC218\uC694" },
      { name: "\uC218\uC6D0\uC2DC", description: "\uACBD\uAE30 \uB0A8\uBD80 \uC911\uC2EC\uC9C0, \uC804\uD1B5\uC2DC\uC7A5\uACFC \uC2E0\uC0C1\uAD8C \uACF5\uC874\uD558\uB294 \uB2E4\uC591\uD55C \uC194\uB8E8\uC158" },
      { name: "\uC6A9\uC778\uC2DC", description: "\uC5D0\uBC84\uB79C\uB4DC\xB7\uC2E0\uAC08 \uC624\uAC70\uB9AC, \uAD00\uAD11\uAC1D\uACFC \uC8FC\uBBFC \uBAA8\uB450 \uB300\uC0C1\uD558\uB294 \uBCF5\uD569 \uB9E4\uC7A5" }
    ]
  },
  {
    code: "incheon",
    nameKo: "\uC778\uCC9C\uAD11\uC5ED\uC2DC",
    nameKoShort: "\uC778\uCC9C",
    nameEn: "Incheon",
    districts: [
    { slug: "남동구", name: "남동구", nameEn: "", dongs: [
      { slug: "구월동", name: "구월동" },
      { slug: "논현동", name: "논현동" },
      { slug: "만수동", name: "만수동" },
      { slug: "고잔동", name: "고잔동" },
      { slug: "장수동", name: "장수동" },
      { slug: "서창동", name: "서창동" },
      { slug: "운연동", name: "운연동" },
      { slug: "남동구", name: "남동구" },
      { slug: "남촌동", name: "남촌동" },
      { slug: "수산동", name: "수산동" },
      { slug: "도림동", name: "도림동" },
      { slug: "간석동", name: "간석동" }
    ] },
    { slug: "계양구", name: "계양구", nameEn: "", dongs: [
      { slug: "계산동", name: "계산동" },
      { slug: "작전동", name: "작전동" },
      { slug: "서운동", name: "서운동" },
      { slug: "임학동", name: "임학동" },
      { slug: "용종동", name: "용종동" },
      { slug: "갈현동", name: "갈현동" },
      { slug: "둑실동", name: "둑실동" },
      { slug: "목상동", name: "목상동" },
      { slug: "다남동", name: "다남동" },
      { slug: "장기동", name: "장기동" },
      { slug: "귤현동", name: "귤현동" },
      { slug: "상야동", name: "상야동" },
      { slug: "하야동", name: "하야동" },
      { slug: "평동", name: "평동" },
      { slug: "노오지동", name: "노오지동" },
      { slug: "선주지동", name: "선주지동" },
      { slug: "이화동", name: "이화동" },
      { slug: "오류동", name: "오류동" },
      { slug: "병방동", name: "병방동" },
      { slug: "방축동", name: "방축동" },
      { slug: "박촌동", name: "박촌동" },
      { slug: "계양구", name: "계양구" },
      { slug: "효성동", name: "효성동" },
      { slug: "동양동", name: "동양동" }
    ] },
    { slug: "중구", name: "중구", nameEn: "", dongs: [
      { slug: "선린동", name: "선린동" },
      { slug: "송월동1가", name: "송월동1가" },
      { slug: "송월동2가", name: "송월동2가" },
      { slug: "송월동3가", name: "송월동3가" },
      { slug: "무의동", name: "무의동" },
      { slug: "운남동", name: "운남동" },
      { slug: "중구", name: "중구" },
      { slug: "중산동", name: "중산동" },
      { slug: "항동3가", name: "항동3가" },
      { slug: "항동4가", name: "항동4가" },
      { slug: "항동5가", name: "항동5가" },
      { slug: "항동6가", name: "항동6가" },
      { slug: "항동7가", name: "항동7가" },
      { slug: "인현동", name: "인현동" },
      { slug: "전동", name: "전동" },
      { slug: "북성동1가", name: "북성동1가" },
      { slug: "북성동2가", name: "북성동2가" },
      { slug: "북성동3가", name: "북성동3가" },
      { slug: "항동1가", name: "항동1가" },
      { slug: "항동2가", name: "항동2가" },
      { slug: "내동", name: "내동" },
      { slug: "경동", name: "경동" },
      { slug: "운서동", name: "운서동" },
      { slug: "해안동3가", name: "해안동3가" },
      { slug: "해안동4가", name: "해안동4가" },
      { slug: "관동1가", name: "관동1가" },
      { slug: "관동2가", name: "관동2가" },
      { slug: "관동3가", name: "관동3가" },
      { slug: "중앙동1가", name: "중앙동1가" },
      { slug: "중앙동2가", name: "중앙동2가" },
      { slug: "중앙동3가", name: "중앙동3가" },
      { slug: "중앙동4가", name: "중앙동4가" },
      { slug: "해안동1가", name: "해안동1가" },
      { slug: "해안동2가", name: "해안동2가" },
      { slug: "운북동", name: "운북동" },
      { slug: "을왕동", name: "을왕동" },
      { slug: "용동", name: "용동" },
      { slug: "남북동", name: "남북동" },
      { slug: "덕교동", name: "덕교동" },
      { slug: "신포동", name: "신포동" },
      { slug: "답동", name: "답동" },
      { slug: "신흥동1가", name: "신흥동1가" },
      { slug: "신흥동2가", name: "신흥동2가" },
      { slug: "신흥동3가", name: "신흥동3가" },
      { slug: "선화동", name: "선화동" },
      { slug: "유동", name: "유동" },
      { slug: "율목동", name: "율목동" },
      { slug: "도원동", name: "도원동" },
      { slug: "송학동1가", name: "송학동1가" },
      { slug: "송학동2가", name: "송학동2가" },
      { slug: "송학동3가", name: "송학동3가" },
      { slug: "사동", name: "사동" },
      { slug: "신생동", name: "신생동" }
    ] },
    { slug: "서구", name: "서구", nameEn: "", dongs: [
      { slug: "오류동", name: "오류동" },
      { slug: "왕길동", name: "왕길동" },
      { slug: "불로동", name: "불로동" },
      { slug: "청라동", name: "청라동" },
      { slug: "서구", name: "서구" },
      { slug: "백석동", name: "백석동" },
      { slug: "시천동", name: "시천동" },
      { slug: "검암동", name: "검암동" },
      { slug: "경서동", name: "경서동" },
      { slug: "신현동", name: "신현동" },
      { slug: "석남동", name: "석남동" },
      { slug: "원창동", name: "원창동" },
      { slug: "당하동", name: "당하동" },
      { slug: "원당동", name: "원당동" },
      { slug: "공촌동", name: "공촌동" },
      { slug: "연희동", name: "연희동" },
      { slug: "심곡동", name: "심곡동" },
      { slug: "가좌동", name: "가좌동" },
      { slug: "마전동", name: "마전동" },
      { slug: "대곡동", name: "대곡동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "가정동", name: "가정동" }
    ] },
    { slug: "연수구", name: "연수구", nameEn: "", dongs: [
      { slug: "옥련동", name: "옥련동" },
      { slug: "선학동", name: "선학동" },
      { slug: "연수동", name: "연수동" },
      { slug: "송도동", name: "송도동" },
      { slug: "청학동", name: "청학동" },
      { slug: "동춘동", name: "동춘동" },
      { slug: "연수구", name: "연수구" }
    ] },
    { slug: "동구", name: "동구", nameEn: "", dongs: [
      { slug: "송현동", name: "송현동" },
      { slug: "동구", name: "동구" },
      { slug: "만석동", name: "만석동" },
      { slug: "화수동", name: "화수동" },
      { slug: "화평동", name: "화평동" },
      { slug: "송림동", name: "송림동" },
      { slug: "창영동", name: "창영동" },
      { slug: "금곡동", name: "금곡동" }
    ] },
    { slug: "강화군", name: "강화군", nameEn: "", dongs: [
      { slug: "강화군", name: "강화군" },
      { slug: "강화읍", name: "강화읍" },
      { slug: "불은면", name: "불은면" },
      { slug: "송해면", name: "송해면" },
      { slug: "선원면", name: "선원면" },
      { slug: "길상면", name: "길상면" },
      { slug: "하점면", name: "하점면" },
      { slug: "양사면", name: "양사면" },
      { slug: "삼산면", name: "삼산면" },
      { slug: "교동면", name: "교동면" },
      { slug: "양도면", name: "양도면" },
      { slug: "화도면", name: "화도면" },
      { slug: "서도면", name: "서도면" },
      { slug: "내가면", name: "내가면" }
    ] },
    { slug: "미추홀구", name: "미추홀구", nameEn: "", dongs: [
      { slug: "주안동", name: "주안동" },
      { slug: "미추홀구", name: "미추홀구" },
      { slug: "숭의동", name: "숭의동" },
      { slug: "도화동", name: "도화동" },
      { slug: "용현동", name: "용현동" },
      { slug: "학익동", name: "학익동" },
      { slug: "관교동", name: "관교동" },
      { slug: "문학동", name: "문학동" }
    ] },
    { slug: "부평구", name: "부평구", nameEn: "", dongs: [
      { slug: "부평구", name: "부평구" },
      { slug: "부평동", name: "부평동" },
      { slug: "갈산동", name: "갈산동" },
      { slug: "부개동", name: "부개동" },
      { slug: "일신동", name: "일신동" },
      { slug: "구산동", name: "구산동" },
      { slug: "삼산동", name: "삼산동" },
      { slug: "산곡동", name: "산곡동" },
      { slug: "청천동", name: "청천동" },
      { slug: "십정동", name: "십정동" }
    ] },
    { slug: "옹진군", name: "옹진군", nameEn: "", dongs: [
      { slug: "옹진군", name: "옹진군" },
      { slug: "북도면", name: "북도면" },
      { slug: "백령면", name: "백령면" },
      { slug: "대청면", name: "대청면" },
      { slug: "덕적면", name: "덕적면" },
      { slug: "영흥면", name: "영흥면" },
      { slug: "자월면", name: "자월면" },
      { slug: "연평면", name: "연평면" }
    ] }
  ],
    districtCount: 10,
    dongCount: 155,
    characteristics: {
      summary: "\uAD6D\uC81C\uACF5\uD56D\xB7\uD56D\uB9CC \uC911\uC2EC\uC758 24\uC2DC\uAC04 \uAE00\uB85C\uBC8C \uBE44\uC988\uB2C8\uC2A4 \uD658\uACBD",
      storeTypes: ["\uBA74\uC138\uC810\xB7\uACF5\uD56D \uC0C1\uC810", "24\uC2DC\uAC04 \uBB3C\uB958\uC13C\uD130", "\uAD6D\uC81C\uC5C5\uBB34\uB2E8\uC9C0", "\uD56D\uB9CC \uC11C\uBE44\uC2A4\uC5C5"],
      customerBase: ["\uAD6D\uC81C\uC120 \uC2B9\uAC1D\xB7\uC2B9\uBB34\uC6D0", "\uBB3C\uB958\xB7\uD56D\uB9CC \uC885\uC0AC\uC790", "\uC1A1\uB3C4 \uAD6D\uC81C\uC5C5\uBB34 \uC9C1\uC7A5\uC778", "\uB2E4\uAD6D\uC801 \uACE0\uAC1D\uCE35"],
      businessHours: "24\uC2DC\uAC04 \uC5F0\uC911\uBB34\uD734 (\uACF5\uD56D\xB7\uD56D\uB9CC), \uAD6D\uC81C \uC2DC\uCC28 \uACE0\uB824\uD55C \uC2EC\uC57C \uC6B4\uC601"
    },
    businessEnvironment: {
      majorIndustries: ["\uD56D\uACF5\xB7\uBB3C\uB958", "\uAD6D\uC81C\uBB34\uC5ED", "\uC81C\uC870\uC5C5\xB7\uACF5\uB2E8", "\uAD00\uAD11\xB7\uBA74\uC138\uC5C5"],
      commercialAreas: ["\uC1A1\uB3C4 \uAD6D\uC81C\uC5C5\uBB34\uB2E8\uC9C0", "\uC778\uCC9C\uACF5\uD56D \uD130\uBBF8\uB110", "\uAD6C\uC6D4\uB3D9 \uB85C\uB370\uC624\uAC70\uB9AC", "\uBD80\uD3C9 \uBB38\uD654\uC758\uAC70\uB9AC"],
      infrastructure: ["\uAD6D\uC81C\uACF5\uD56D \uC5F0\uACC4", "\uD56D\uB9CC \uBB3C\uB958\uB9DD", "\uACBD\uC81C\uC790\uC720\uAD6C\uC5ED", "\uCCA8\uB2E8 IT \uC778\uD504\uB77C"]
    },
    installationTips: [
      "\uB2E4\uAD6D\uC5B4 \uC9C0\uC6D0 (\uD55C\xB7\uC601\xB7\uC911\xB7\uC77C) \uD544\uC218, \uC2E4\uC2DC\uAC04 \uD658\uC728 \uC5F0\uB3D9",
      "24\uC2DC\uAC04 \uBB34\uC911\uB2E8 \uC6B4\uC601\uC744 \uC704\uD55C \uC774\uC911\uD654\xB7\uBC31\uC5C5 \uC2DC\uC2A4\uD15C",
      "\uAD6D\uC81C \uCE74\uB4DC\xB7\uBAA8\uBC14\uC77C\uD398\uC774 \uD638\uD658\uC131 \uCD5C\uC6B0\uC120",
      "\uBCF4\uC548\xB7\uCD9C\uC785\uD1B5\uC81C \uC5F0\uB3D9\uD55C \uD1B5\uD569 \uC194\uB8E8\uC158 \uC120\uD638"
    ],
    featuredDistricts: [
      { name: "\uC911\uAD6C", description: "\uC778\uCC9C\uACF5\uD56D\xB7\uC601\uC885\uB3C4, \uBA74\uC138\uC810\uACFC \uD56D\uACF5\uC0AC \uB77C\uC6B4\uC9C0 \uD2B9\uD654 \uC194\uB8E8\uC158" },
      { name: "\uC5F0\uC218\uAD6C", description: "\uC1A1\uB3C4 \uAD6D\uC81C\uC5C5\uBB34\uB2E8\uC9C0, \uAE00\uB85C\uBC8C \uAE30\uC5C5 \uB300\uC0C1 \uD504\uB9AC\uBBF8\uC5C4 \uD1B5\uD569\uAD00\uB9AC" },
      { name: "\uBD80\uD3C9\uAD6C", description: "\uC804\uD1B5 \uC0C1\uAD8C\uACFC \uC9C0\uD558\uCCA0 \uC5F0\uACC4, \uC11C\uBBFC\uD615 \uB9E4\uC7A5\uC758 \uD6A8\uC728\uC131 \uC911\uC2DC" },
      { name: "\uC11C\uAD6C", description: "\uAC80\uB2E8\xB7\uCCAD\uB77C \uC2E0\uB3C4\uC2DC, \uC8FC\uAC70\uB2E8\uC9C0 \uC5F0\uACC4 \uC0DD\uD65C\uBC00\uCC29\uD615 \uC11C\uBE44\uC2A4" }
    ]
  },
  // ========================================
  // 부산광역시
  // ========================================
  {
    code: "busan",
    nameKo: "\uBD80\uC0B0\uAD11\uC5ED\uC2DC",
    nameKoShort: "\uBD80\uC0B0",
    nameEn: "Busan",
    districts: [
    { slug: "중구", name: "중구", nameEn: "", dongs: [
      { slug: "동광동1가", name: "동광동1가" },
      { slug: "동광동2가", name: "동광동2가" },
      { slug: "동광동3가", name: "동광동3가" },
      { slug: "광복동1가", name: "광복동1가" },
      { slug: "대청동3가", name: "대청동3가" },
      { slug: "신창동2가", name: "신창동2가" },
      { slug: "신창동3가", name: "신창동3가" },
      { slug: "신창동4가", name: "신창동4가" },
      { slug: "남포동1가", name: "남포동1가" },
      { slug: "남포동2가", name: "남포동2가" },
      { slug: "광복동3가", name: "광복동3가" },
      { slug: "창선동1가", name: "창선동1가" },
      { slug: "창선동2가", name: "창선동2가" },
      { slug: "중앙동5가", name: "중앙동5가" },
      { slug: "중앙동6가", name: "중앙동6가" },
      { slug: "중앙동7가", name: "중앙동7가" },
      { slug: "중구", name: "중구" },
      { slug: "영주동", name: "영주동" },
      { slug: "대창동2가", name: "대창동2가" },
      { slug: "중앙동1가", name: "중앙동1가" },
      { slug: "중앙동2가", name: "중앙동2가" },
      { slug: "중앙동3가", name: "중앙동3가" },
      { slug: "중앙동4가", name: "중앙동4가" },
      { slug: "보수동3가", name: "보수동3가" },
      { slug: "부평동1가", name: "부평동1가" },
      { slug: "부평동2가", name: "부평동2가" },
      { slug: "부평동3가", name: "부평동3가" },
      { slug: "부평동4가", name: "부평동4가" },
      { slug: "신창동1가", name: "신창동1가" },
      { slug: "동광동4가", name: "동광동4가" },
      { slug: "동광동5가", name: "동광동5가" },
      { slug: "대청동1가", name: "대청동1가" },
      { slug: "대청동2가", name: "대청동2가" },
      { slug: "대창동1가", name: "대창동1가" },
      { slug: "보수동1가", name: "보수동1가" },
      { slug: "보수동2가", name: "보수동2가" },
      { slug: "대청동4가", name: "대청동4가" },
      { slug: "광복동2가", name: "광복동2가" },
      { slug: "남포동3가", name: "남포동3가" },
      { slug: "남포동4가", name: "남포동4가" },
      { slug: "남포동5가", name: "남포동5가" },
      { slug: "남포동6가", name: "남포동6가" }
    ] },
    { slug: "부산진구", name: "부산진구", nameEn: "", dongs: [
      { slug: "전포동", name: "전포동" },
      { slug: "부전동", name: "부전동" },
      { slug: "범천동", name: "범천동" },
      { slug: "범전동", name: "범전동" },
      { slug: "연지동", name: "연지동" },
      { slug: "초읍동", name: "초읍동" },
      { slug: "부산진구", name: "부산진구" },
      { slug: "양정동", name: "양정동" },
      { slug: "부암동", name: "부암동" },
      { slug: "당감동", name: "당감동" },
      { slug: "가야동", name: "가야동" },
      { slug: "개금동", name: "개금동" }
    ] },
    { slug: "강서구", name: "강서구", nameEn: "", dongs: [
      { slug: "신호동", name: "신호동" },
      { slug: "동선동", name: "동선동" },
      { slug: "미음동", name: "미음동" },
      { slug: "천성동", name: "천성동" },
      { slug: "대항동", name: "대항동" },
      { slug: "강서구", name: "강서구" },
      { slug: "대저1동", name: "대저1동" },
      { slug: "대저2동", name: "대저2동" },
      { slug: "강동동", name: "강동동" },
      { slug: "명지동", name: "명지동" },
      { slug: "죽림동", name: "죽림동" },
      { slug: "식만동", name: "식만동" },
      { slug: "죽동동", name: "죽동동" },
      { slug: "봉림동", name: "봉림동" },
      { slug: "송정동", name: "송정동" },
      { slug: "화전동", name: "화전동" },
      { slug: "녹산동", name: "녹산동" },
      { slug: "생곡동", name: "생곡동" },
      { slug: "구랑동", name: "구랑동" },
      { slug: "지사동", name: "지사동" },
      { slug: "범방동", name: "범방동" },
      { slug: "성북동", name: "성북동" },
      { slug: "눌차동", name: "눌차동" }
    ] },
    { slug: "북구", name: "북구", nameEn: "", dongs: [
      { slug: "만덕동", name: "만덕동" },
      { slug: "덕천동", name: "덕천동" },
      { slug: "화명동", name: "화명동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "구포동", name: "구포동" },
      { slug: "북구", name: "북구" }
    ] },
    { slug: "해운대구", name: "해운대구", nameEn: "", dongs: [
      { slug: "해운대구", name: "해운대구" },
      { slug: "우동", name: "우동" },
      { slug: "중동", name: "중동" },
      { slug: "좌동", name: "좌동" },
      { slug: "송정동", name: "송정동" },
      { slug: "재송동", name: "재송동" },
      { slug: "석대동", name: "석대동" },
      { slug: "반여동", name: "반여동" },
      { slug: "반송동", name: "반송동" }
    ] },
    { slug: "서구", name: "서구", nameEn: "", dongs: [
      { slug: "동대신동2가", name: "동대신동2가" },
      { slug: "동대신동3가", name: "동대신동3가" },
      { slug: "서대신동1가", name: "서대신동1가" },
      { slug: "토성동1가", name: "토성동1가" },
      { slug: "토성동2가", name: "토성동2가" },
      { slug: "토성동3가", name: "토성동3가" },
      { slug: "아미동1가", name: "아미동1가" },
      { slug: "아미동2가", name: "아미동2가" },
      { slug: "토성동4가", name: "토성동4가" },
      { slug: "부용동1가", name: "부용동1가" },
      { slug: "부민동2가", name: "부민동2가" },
      { slug: "부민동3가", name: "부민동3가" },
      { slug: "부용동2가", name: "부용동2가" },
      { slug: "부민동1가", name: "부민동1가" },
      { slug: "서구", name: "서구" },
      { slug: "동대신동1가", name: "동대신동1가" },
      { slug: "서대신동3가", name: "서대신동3가" },
      { slug: "초장동", name: "초장동" },
      { slug: "충무동1가", name: "충무동1가" },
      { slug: "충무동2가", name: "충무동2가" },
      { slug: "충무동3가", name: "충무동3가" },
      { slug: "남부민동", name: "남부민동" },
      { slug: "암남동", name: "암남동" },
      { slug: "서대신동2가", name: "서대신동2가" },
      { slug: "토성동5가", name: "토성동5가" }
    ] },
    { slug: "영도구", name: "영도구", nameEn: "", dongs: [
      { slug: "대평동1가", name: "대평동1가" },
      { slug: "영선동1가", name: "영선동1가" },
      { slug: "영선동2가", name: "영선동2가" },
      { slug: "영선동3가", name: "영선동3가" },
      { slug: "영선동4가", name: "영선동4가" },
      { slug: "신선동1가", name: "신선동1가" },
      { slug: "신선동2가", name: "신선동2가" },
      { slug: "청학동", name: "청학동" },
      { slug: "봉래동4가", name: "봉래동4가" },
      { slug: "봉래동5가", name: "봉래동5가" },
      { slug: "대교동1가", name: "대교동1가" },
      { slug: "대교동2가", name: "대교동2가" },
      { slug: "남항동3가", name: "남항동3가" },
      { slug: "남항동1가", name: "남항동1가" },
      { slug: "남항동2가", name: "남항동2가" },
      { slug: "영도구", name: "영도구" },
      { slug: "신선동3가", name: "신선동3가" },
      { slug: "봉래동1가", name: "봉래동1가" },
      { slug: "봉래동2가", name: "봉래동2가" },
      { slug: "봉래동3가", name: "봉래동3가" },
      { slug: "동삼동", name: "동삼동" },
      { slug: "대평동2가", name: "대평동2가" }
    ] },
    { slug: "기장군", name: "기장군", nameEn: "", dongs: [
      { slug: "철마면", name: "철마면" },
      { slug: "장안읍", name: "장안읍" },
      { slug: "정관읍", name: "정관읍" },
      { slug: "일광읍", name: "일광읍" },
      { slug: "기장군", name: "기장군" },
      { slug: "기장읍", name: "기장읍" },
      { slug: "일광면", name: "일광면" },
      { slug: "정관면", name: "정관면" }
    ] },
    { slug: "금정구", name: "금정구", nameEn: "", dongs: [
      { slug: "회동동", name: "회동동" },
      { slug: "금정구", name: "금정구" },
      { slug: "두구동", name: "두구동" },
      { slug: "청룡동", name: "청룡동" },
      { slug: "남산동", name: "남산동" },
      { slug: "선동", name: "선동" },
      { slug: "오륜동", name: "오륜동" },
      { slug: "금성동", name: "금성동" },
      { slug: "구서동", name: "구서동" },
      { slug: "장전동", name: "장전동" },
      { slug: "부곡동", name: "부곡동" },
      { slug: "서동", name: "서동" },
      { slug: "금사동", name: "금사동" },
      { slug: "노포동", name: "노포동" }
    ] },
    { slug: "사하구", name: "사하구", nameEn: "", dongs: [
      { slug: "감천동", name: "감천동" },
      { slug: "괴정동", name: "괴정동" },
      { slug: "당리동", name: "당리동" },
      { slug: "하단동", name: "하단동" },
      { slug: "신평동", name: "신평동" },
      { slug: "장림동", name: "장림동" },
      { slug: "구평동", name: "구평동" },
      { slug: "사하구", name: "사하구" },
      { slug: "다대동", name: "다대동" }
    ] },
    { slug: "남구", name: "남구", nameEn: "", dongs: [
      { slug: "용당동", name: "용당동" },
      { slug: "문현동", name: "문현동" },
      { slug: "우암동", name: "우암동" },
      { slug: "감만동", name: "감만동" },
      { slug: "남구", name: "남구" },
      { slug: "대연동", name: "대연동" },
      { slug: "용호동", name: "용호동" }
    ] },
    { slug: "연제구", name: "연제구", nameEn: "", dongs: [
      { slug: "연제구", name: "연제구" },
      { slug: "연산동", name: "연산동" },
      { slug: "거제동", name: "거제동" }
    ] },
    { slug: "수영구", name: "수영구", nameEn: "", dongs: [
      { slug: "남천동", name: "남천동" },
      { slug: "망미동", name: "망미동" },
      { slug: "수영구", name: "수영구" },
      { slug: "수영동", name: "수영동" },
      { slug: "민락동", name: "민락동" },
      { slug: "광안동", name: "광안동" }
    ] },
    { slug: "사상구", name: "사상구", nameEn: "", dongs: [
      { slug: "사상구", name: "사상구" },
      { slug: "삼락동", name: "삼락동" },
      { slug: "모라동", name: "모라동" },
      { slug: "덕포동", name: "덕포동" },
      { slug: "괘법동", name: "괘법동" },
      { slug: "감전동", name: "감전동" },
      { slug: "주례동", name: "주례동" },
      { slug: "학장동", name: "학장동" },
      { slug: "엄궁동", name: "엄궁동" }
    ] },
    { slug: "동구", name: "동구", nameEn: "", dongs: [
      { slug: "초량동", name: "초량동" },
      { slug: "수정동", name: "수정동" },
      { slug: "좌천동", name: "좌천동" },
      { slug: "범일동", name: "범일동" },
      { slug: "동구", name: "동구" }
    ] },
    { slug: "동래구", name: "동래구", nameEn: "", dongs: [
      { slug: "동래구", name: "동래구" },
      { slug: "명장동", name: "명장동" },
      { slug: "안락동", name: "안락동" },
      { slug: "칠산동", name: "칠산동" },
      { slug: "낙민동", name: "낙민동" },
      { slug: "복천동", name: "복천동" },
      { slug: "수안동", name: "수안동" },
      { slug: "명륜동", name: "명륜동" },
      { slug: "온천동", name: "온천동" },
      { slug: "사직동", name: "사직동" }
    ] }
  ],
    districtCount: 16,
    dongCount: 205,
    characteristics: {
      summary: "\uD56D\uB9CC\xB7\uD574\uC591 \uAD00\uAD11\uACFC \uC601\uD654\xB7\uBB38\uD654 \uC0B0\uC5C5\uC774 \uBC1C\uB2EC\uD55C \uC81C2\uC758 \uB300\uB3C4\uC2DC",
      storeTypes: ["\uD574\uC0B0\uBB3C \uC2DD\uB2F9", "\uAD00\uAD11\uC9C0 \uCE74\uD398", "\uC601\uD654\uAD00\xB7\uACF5\uC5F0\uC7A5", "\uD574\uC218\uC695\uC7A5 \uB9E4\uC7A5"],
      customerBase: ["\uAD6D\uB0B4\uC678 \uAD00\uAD11\uAC1D", "\uBD80\uC0B0 \uC2DC\uBBFC", "\uBD80\uC0B0\uD56D \uBB3C\uB958 \uC885\uC0AC\uC790", "\uC601\uD654\xB7\uBB38\uD654 \uC0B0\uC5C5 \uC885\uC0AC\uC790"],
      businessHours: "\uC5EC\uB984 \uC131\uC218\uAE30 \uC2EC\uC57C \uC6B4\uC601, \uD3C9\uC2DC \uC624\uD6C4 6-10\uC2DC \uD53C\uD06C\uD0C0\uC784"
    },
    businessEnvironment: {
      majorIndustries: ["\uD574\uC0B0\uBB3C\xB7\uD68C", "\uAD00\uAD11\xB7\uC219\uBC15", "\uC601\uD654\xB7\uBB38\uD654", "\uBB3C\uB958\xB7\uD56D\uB9CC"],
      commercialAreas: ["\uD574\uC6B4\uB300\xB7\uC13C\uD140\uC2DC\uD2F0", "\uC11C\uBA74\xB7\uBD80\uC0B0\uC9C4", "\uAD11\uC548\uB9AC\xB7\uC218\uC601", "\uB0A8\uD3EC\uB3D9\xB7\uC911\uAD6C"],
      infrastructure: ["\uBD80\uC0B0\uD56D \uC5F0\uACC4", "\uD574\uC591 \uAD00\uAD11 \uC778\uD504\uB77C", "KTX \uBD80\uC0B0\uC5ED", "\uC9C0\uD558\uCCA0 4\uD638\uC120"]
    },
    installationTips: [
      "\uD574\uBCC0 \uC778\uADFC \uC5FC\uBD84 \uB300\uC751 \uBC29\uC218\xB7\uBC29\uCCAD \uC7A5\uBE44 \uD544\uC218",
      "\uAD00\uAD11\uAC1D \uB300\uC0C1 \uB2E4\uAD6D\uC5B4(\uD55C\xB7\uC601\xB7\uC911\xB7\uC77C) UI \uC9C0\uC6D0",
      "\uC131\uC218\uAE30\xB7\uBE44\uC218\uAE30 \uB9E4\uCD9C \uCC28\uC774 \uACE0\uB824\uD55C \uD655\uC7A5\uD615 \uC124\uACC4",
      "\uBD80\uC0B0 \uC0AC\uD22C\uB9AC UI \uC635\uC158\uC73C\uB85C \uCE5C\uADFC\uAC10 \uAC15\uD654"
    ],
    featuredDistricts: [
      { name: "\uD574\uC6B4\uB300\uAD6C", description: "\uAD6D\uC81C \uAD00\uAD11\uC9C0, \uD504\uB9AC\uBBF8\uC5C4 \uCE74\uD398\xB7\uB808\uC2A4\uD1A0\uB791 \uC9D1\uC911" },
      { name: "\uBD80\uC0B0\uC9C4\uAD6C", description: "\uC11C\uBA74 \uC0C1\uAD8C, \uC1FC\uD551\xB7\uC678\uC2DD \uC911\uC2EC\uC9C0" },
      { name: "\uC911\uAD6C", description: "\uB0A8\uD3EC\uB3D9\xB7\uAD11\uBCF5\uB85C, \uC804\uD1B5 \uC0C1\uAD8C\uACFC \uAD00\uAD11\uC9C0 \uACF5\uC874" },
      { name: "\uC218\uC601\uAD6C", description: "\uAD11\uC548\uB9AC \uD574\uC218\uC695\uC7A5, SNS \uD56B\uD50C\uB808\uC774\uC2A4 \uCE74\uD398" }
    ]
  },
  // ========================================
  // 대구광역시
  // ========================================
  {
    code: "daegu",
    nameKo: "\uB300\uAD6C\uAD11\uC5ED\uC2DC",
    nameKoShort: "\uB300\uAD6C",
    nameEn: "Daegu",
    districts: [
    { slug: "수성구", name: "수성구", nameEn: "", dongs: [
      { slug: "두산동", name: "두산동" },
      { slug: "지산동", name: "지산동" },
      { slug: "고모동", name: "고모동" },
      { slug: "가천동", name: "가천동" },
      { slug: "대흥동", name: "대흥동" },
      { slug: "수성동2가", name: "수성동2가" },
      { slug: "수성동3가", name: "수성동3가" },
      { slug: "수성동4가", name: "수성동4가" },
      { slug: "황금동", name: "황금동" },
      { slug: "범어동", name: "범어동" },
      { slug: "만촌동", name: "만촌동" },
      { slug: "수성구", name: "수성구" },
      { slug: "중동", name: "중동" },
      { slug: "상동", name: "상동" },
      { slug: "파동", name: "파동" },
      { slug: "범물동", name: "범물동" },
      { slug: "시지동", name: "시지동" },
      { slug: "매호동", name: "매호동" },
      { slug: "성동", name: "성동" },
      { slug: "사월동", name: "사월동" },
      { slug: "신매동", name: "신매동" },
      { slug: "욱수동", name: "욱수동" },
      { slug: "노변동", name: "노변동" },
      { slug: "삼덕동", name: "삼덕동" },
      { slug: "연호동", name: "연호동" },
      { slug: "이천동", name: "이천동" },
      { slug: "수성동1가", name: "수성동1가" }
    ] },
    { slug: "달서구", name: "달서구", nameEn: "", dongs: [
      { slug: "달서구", name: "달서구" },
      { slug: "성당동", name: "성당동" },
      { slug: "두류동", name: "두류동" },
      { slug: "파호동", name: "파호동" },
      { slug: "호림동", name: "호림동" },
      { slug: "상인동", name: "상인동" },
      { slug: "갈산동", name: "갈산동" },
      { slug: "송현동", name: "송현동" },
      { slug: "대곡동", name: "대곡동" },
      { slug: "진천동", name: "진천동" },
      { slug: "유천동", name: "유천동" },
      { slug: "대천동", name: "대천동" },
      { slug: "본동", name: "본동" },
      { slug: "호산동", name: "호산동" },
      { slug: "도원동", name: "도원동" },
      { slug: "신당동", name: "신당동" },
      { slug: "이곡동", name: "이곡동" },
      { slug: "감삼동", name: "감삼동" },
      { slug: "본리동", name: "본리동" },
      { slug: "장기동", name: "장기동" },
      { slug: "월성동", name: "월성동" },
      { slug: "월암동", name: "월암동" },
      { slug: "용산동", name: "용산동" },
      { slug: "죽전동", name: "죽전동" },
      { slug: "장동", name: "장동" }
    ] },
    { slug: "중구", name: "중구", nameEn: "", dongs: [
      { slug: "동일동", name: "동일동" },
      { slug: "남일동", name: "남일동" },
      { slug: "남성로", name: "남성로" },
      { slug: "계산동1가", name: "계산동1가" },
      { slug: "태평로3가", name: "태평로3가" },
      { slug: "인교동", name: "인교동" },
      { slug: "서야동", name: "서야동" },
      { slug: "서성로1가", name: "서성로1가" },
      { slug: "시장북로", name: "시장북로" },
      { slug: "문화동", name: "문화동" },
      { slug: "북성로1가", name: "북성로1가" },
      { slug: "화전동", name: "화전동" },
      { slug: "공평동", name: "공평동" },
      { slug: "동성로2가", name: "동성로2가" },
      { slug: "태평로1가", name: "태평로1가" },
      { slug: "교동", name: "교동" },
      { slug: "용덕동", name: "용덕동" },
      { slug: "상덕동", name: "상덕동" },
      { slug: "완전동", name: "완전동" },
      { slug: "도원동", name: "도원동" },
      { slug: "수창동", name: "수창동" },
      { slug: "중구", name: "중구" },
      { slug: "동인동1가", name: "동인동1가" },
      { slug: "동인동2가", name: "동인동2가" },
      { slug: "대안동", name: "대안동" },
      { slug: "계산동2가", name: "계산동2가" },
      { slug: "동산동", name: "동산동" },
      { slug: "서문로2가", name: "서문로2가" },
      { slug: "서성로2가", name: "서성로2가" },
      { slug: "하서동", name: "하서동" },
      { slug: "봉산동", name: "봉산동" },
      { slug: "장관동", name: "장관동" },
      { slug: "향촌동", name: "향촌동" },
      { slug: "북내동", name: "북내동" },
      { slug: "대신동", name: "대신동" },
      { slug: "달성동", name: "달성동" },
      { slug: "남산동", name: "남산동" },
      { slug: "대봉동", name: "대봉동" },
      { slug: "전동", name: "전동" },
      { slug: "동성로3가", name: "동성로3가" },
      { slug: "동문동", name: "동문동" },
      { slug: "동인동4가", name: "동인동4가" },
      { slug: "삼덕동1가", name: "삼덕동1가" },
      { slug: "삼덕동2가", name: "삼덕동2가" },
      { slug: "삼덕동3가", name: "삼덕동3가" },
      { slug: "동성로1가", name: "동성로1가" },
      { slug: "태평로2가", name: "태평로2가" },
      { slug: "상서동", name: "상서동" },
      { slug: "수동", name: "수동" },
      { slug: "덕산동", name: "덕산동" },
      { slug: "종로1가", name: "종로1가" },
      { slug: "종로2가", name: "종로2가" },
      { slug: "사일동", name: "사일동" },
      { slug: "포정동", name: "포정동" },
      { slug: "동인동3가", name: "동인동3가" },
      { slug: "서문로1가", name: "서문로1가" },
      { slug: "서내동", name: "서내동" },
      { slug: "북성로2가", name: "북성로2가" }
    ] },
    { slug: "동구", name: "동구", nameEn: "", dongs: [
      { slug: "괴전동", name: "괴전동" },
      { slug: "대림동", name: "대림동" },
      { slug: "봉무동", name: "봉무동" },
      { slug: "불로동", name: "불로동" },
      { slug: "도동", name: "도동" },
      { slug: "지저동", name: "지저동" },
      { slug: "입석동", name: "입석동" },
      { slug: "검사동", name: "검사동" },
      { slug: "방촌동", name: "방촌동" },
      { slug: "둔산동", name: "둔산동" },
      { slug: "부동", name: "부동" },
      { slug: "신평동", name: "신평동" },
      { slug: "서호동", name: "서호동" },
      { slug: "동호동", name: "동호동" },
      { slug: "신기동", name: "신기동" },
      { slug: "상매동", name: "상매동" },
      { slug: "신천동", name: "신천동" },
      { slug: "율암동", name: "율암동" },
      { slug: "효목동", name: "효목동" },
      { slug: "평광동", name: "평광동" },
      { slug: "동내동", name: "동내동" },
      { slug: "금강동", name: "금강동" },
      { slug: "동구", name: "동구" },
      { slug: "신암동", name: "신암동" },
      { slug: "미대동", name: "미대동" },
      { slug: "내동", name: "내동" },
      { slug: "신용동", name: "신용동" },
      { slug: "중대동", name: "중대동" },
      { slug: "송정동", name: "송정동" },
      { slug: "덕곡동", name: "덕곡동" },
      { slug: "지묘동", name: "지묘동" },
      { slug: "용계동", name: "용계동" },
      { slug: "매여동", name: "매여동" },
      { slug: "사복동", name: "사복동" },
      { slug: "숙천동", name: "숙천동" },
      { slug: "율하동", name: "율하동" },
      { slug: "각산동", name: "각산동" },
      { slug: "신서동", name: "신서동" },
      { slug: "내곡동", name: "내곡동" },
      { slug: "능성동", name: "능성동" },
      { slug: "진인동", name: "진인동" },
      { slug: "도학동", name: "도학동" },
      { slug: "백안동", name: "백안동" },
      { slug: "미곡동", name: "미곡동" },
      { slug: "용수동", name: "용수동" },
      { slug: "신무동", name: "신무동" }
    ] },
    { slug: "서구", name: "서구", nameEn: "", dongs: [
      { slug: "비산동", name: "비산동" },
      { slug: "평리동", name: "평리동" },
      { slug: "상리동", name: "상리동" },
      { slug: "내당동", name: "내당동" },
      { slug: "중리동", name: "중리동" },
      { slug: "이현동", name: "이현동" },
      { slug: "원대동1가", name: "원대동1가" },
      { slug: "서구", name: "서구" },
      { slug: "원대동2가", name: "원대동2가" },
      { slug: "원대동3가", name: "원대동3가" }
    ] },
    { slug: "군위군", name: "군위군", nameEn: "", dongs: [
      { slug: "우보면", name: "우보면" },
      { slug: "소보면", name: "소보면" },
      { slug: "삼국유사면", name: "삼국유사면" },
      { slug: "산성면", name: "산성면" },
      { slug: "효령면", name: "효령면" },
      { slug: "의흥면", name: "의흥면" },
      { slug: "군위군", name: "군위군" },
      { slug: "군위읍", name: "군위읍" },
      { slug: "부계면", name: "부계면" }
    ] },
    { slug: "달성군", name: "달성군", nameEn: "", dongs: [
      { slug: "하빈면", name: "하빈면" },
      { slug: "달성군", name: "달성군" },
      { slug: "다사읍", name: "다사읍" },
      { slug: "가창면", name: "가창면" },
      { slug: "옥포읍", name: "옥포읍" },
      { slug: "현풍읍", name: "현풍읍" },
      { slug: "논공읍", name: "논공읍" },
      { slug: "유가읍", name: "유가읍" },
      { slug: "화원읍", name: "화원읍" },
      { slug: "구지면", name: "구지면" },
      { slug: "현풍면", name: "현풍면" },
      { slug: "옥포면", name: "옥포면" },
      { slug: "유가면", name: "유가면" }
    ] },
    { slug: "북구", name: "북구", nameEn: "", dongs: [
      { slug: "관음동", name: "관음동" },
      { slug: "태전동", name: "태전동" },
      { slug: "매천동", name: "매천동" },
      { slug: "팔달동", name: "팔달동" },
      { slug: "금호동", name: "금호동" },
      { slug: "사수동", name: "사수동" },
      { slug: "연경동", name: "연경동" },
      { slug: "서변동", name: "서변동" },
      { slug: "조야동", name: "조야동" },
      { slug: "노곡동", name: "노곡동" },
      { slug: "읍내동", name: "읍내동" },
      { slug: "동호동", name: "동호동" },
      { slug: "학정동", name: "학정동" },
      { slug: "산격동", name: "산격동" },
      { slug: "복현동", name: "복현동" },
      { slug: "검단동", name: "검단동" },
      { slug: "동변동", name: "동변동" },
      { slug: "도남동", name: "도남동" },
      { slug: "국우동", name: "국우동" },
      { slug: "구암동", name: "구암동" },
      { slug: "동천동", name: "동천동" },
      { slug: "북구", name: "북구" },
      { slug: "칠성동1가", name: "칠성동1가" },
      { slug: "칠성동2가", name: "칠성동2가" },
      { slug: "고성동1가", name: "고성동1가" },
      { slug: "고성동2가", name: "고성동2가" },
      { slug: "고성동3가", name: "고성동3가" },
      { slug: "침산동", name: "침산동" },
      { slug: "노원동1가", name: "노원동1가" },
      { slug: "노원동2가", name: "노원동2가" },
      { slug: "노원동3가", name: "노원동3가" },
      { slug: "대현동", name: "대현동" }
    ] },
    { slug: "남구", name: "남구", nameEn: "", dongs: [
      { slug: "대명동", name: "대명동" },
      { slug: "봉덕동", name: "봉덕동" },
      { slug: "남구", name: "남구" },
      { slug: "이천동", name: "이천동" }
    ] }
  ],
    districtCount: 9,
    dongCount: 139,
    characteristics: {
      summary: "\uC12C\uC720\xB7\uD328\uC158 \uC0B0\uC5C5\uC758 \uC911\uC2EC\uC9C0, \uBCF4\uC218\uC801 \uC0C1\uAD8C\uACFC \uAD50\uC721 \uD2B9\uAD6C \uACF5\uC874",
      storeTypes: ["\uD328\uC158\xB7\uC7A1\uD654\uC810", "\uD559\uC6D0\uAC00 \uCE74\uD398", "\uC804\uD1B5 \uC2DC\uC7A5", "\uB300\uD559\uAC00 \uB9E4\uC7A5"],
      customerBase: ["\uB300\uAD6C \uC2DC\uBBFC", "\uD559\uC0DD\xB7\uD559\uBD80\uBAA8", "\uC12C\uC720 \uC0B0\uC5C5 \uC885\uC0AC\uC790", "\uACF5\uBB34\uC6D0"],
      businessHours: "\uD3C9\uC77C \uC624\uD6C4 4-9\uC2DC \uD53C\uD06C\uD0C0\uC784, \uC8FC\uB9D0 \uAC00\uC871 \uACE0\uAC1D \uC9D1\uC911"
    },
    businessEnvironment: {
      majorIndustries: ["\uC12C\uC720\xB7\uD328\uC158", "\uC790\uB3D9\uCC28 \uBD80\uD488", "\uC758\uB8CC \uC11C\uBE44\uC2A4", "\uAD50\uC721\xB7\uD559\uC6D0"],
      commercialAreas: ["\uB3D9\uC131\uB85C\xB7\uC911\uAD6C", "\uBC94\uC5B4\xB7\uC218\uC131", "\uCE60\uACE1\xB7\uBD81\uAD6C", "\uC0C1\uC778\xB7\uB2EC\uC11C"],
      infrastructure: ["\uB300\uAD6C \uC9C0\uD558\uCCA0 3\uD638\uC120", "\uB3D9\uB300\uAD6C\uC5ED KTX", "\uAD6D\uAC00\uC0B0\uC5C5\uB2E8\uC9C0", "\uC758\uB8CC\uD2B9\uAD6C"]
    },
    installationTips: [
      "\uAD50\uC721 \uD2B9\uAD6C \uB9E4\uC7A5 \uB300\uC0C1 \uC7A5\uC2DC\uAC04 \uC6B4\uC601 \uB0B4\uAD6C\uC131 \uC911\uC2DC",
      "\uBCF4\uC218\uC801 \uACE0\uAC1D\uCE35 \uACE0\uB824\uD55C \uC9C1\uAD00\uC801 UI \uC124\uACC4",
      "\uC804\uD1B5 \uC2DC\uC7A5 \uB9E4\uC7A5\uC758 \uC544\uB0A0\uB85C\uADF8 \uBCD1\uD589 \uC6B4\uC601",
      "\uD559\uC6D0\uAC00 \uB9E4\uC7A5\uC758 \uACB0\uC81C \uC18D\uB3C4 \uCD5C\uC801\uD654"
    ],
    featuredDistricts: [
      { name: "\uC911\uAD6C", description: "\uB3D9\uC131\uB85C \uC0C1\uAD8C, \uB300\uAD6C \uCD5C\uB300 \uBC88\uD654\uAC00 \uB9E4\uC7A5 \uC9D1\uC911" },
      { name: "\uC218\uC131\uAD6C", description: "\uAD50\uC721 \uD2B9\uAD6C, \uD559\uC6D0\uAC00\uC640 \uD504\uB9AC\uBBF8\uC5C4 \uCE74\uD398 \uACF5\uC874" },
      { name: "\uB2EC\uC11C\uAD6C", description: "\uC8FC\uAC70 \uBC00\uC9D1\uC9C0, \uB300\uD615 \uD504\uB79C\uCC28\uC774\uC988\xB7\uC0DD\uD65C\uD615 \uB9E4\uC7A5" },
      { name: "\uBD81\uAD6C", description: "\uCE60\uACE1 \uC2E0\uB3C4\uC2DC, \uC544\uD30C\uD2B8 \uB2E8\uC9C0 \uC5F0\uACC4 \uC0C1\uAD8C" }
    ]
  },
  // ========================================
  // 광주광역시
  // ========================================
  {
    code: "gwangju",
    nameKo: "\uAD11\uC8FC\uAD11\uC5ED\uC2DC",
    nameKoShort: "\uAD11\uC8FC",
    nameEn: "Gwangju",
    districts: [
    { slug: "북구", name: "북구", nameEn: "", dongs: [
      { slug: "월출동", name: "월출동" },
      { slug: "두암동", name: "두암동" },
      { slug: "용강동", name: "용강동" },
      { slug: "생용동", name: "생용동" },
      { slug: "수곡동", name: "수곡동" },
      { slug: "효령동", name: "효령동" },
      { slug: "용전동", name: "용전동" },
      { slug: "본촌동", name: "본촌동" },
      { slug: "일곡동", name: "일곡동" },
      { slug: "양산동", name: "양산동" },
      { slug: "연제동", name: "연제동" },
      { slug: "중흥동", name: "중흥동" },
      { slug: "누문동", name: "누문동" },
      { slug: "북동", name: "북동" },
      { slug: "임동", name: "임동" },
      { slug: "신안동", name: "신안동" },
      { slug: "신용동", name: "신용동" },
      { slug: "용두동", name: "용두동" },
      { slug: "지야동", name: "지야동" },
      { slug: "매곡동", name: "매곡동" },
      { slug: "유동", name: "유동" },
      { slug: "용봉동", name: "용봉동" },
      { slug: "오치동", name: "오치동" },
      { slug: "삼각동", name: "삼각동" },
      { slug: "충효동", name: "충효동" },
      { slug: "덕의동", name: "덕의동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "망월동", name: "망월동" },
      { slug: "청풍동", name: "청풍동" },
      { slug: "화암동", name: "화암동" },
      { slug: "장등동", name: "장등동" },
      { slug: "북구", name: "북구" },
      { slug: "운암동", name: "운암동" },
      { slug: "동림동", name: "동림동" },
      { slug: "대촌동", name: "대촌동" },
      { slug: "우산동", name: "우산동" },
      { slug: "풍향동", name: "풍향동" },
      { slug: "문흥동", name: "문흥동" },
      { slug: "각화동", name: "각화동" },
      { slug: "태령동", name: "태령동" },
      { slug: "오룡동", name: "오룡동" },
      { slug: "운정동", name: "운정동" }
    ] },
    { slug: "남구", name: "남구", nameEn: "", dongs: [
      { slug: "서동", name: "서동" },
      { slug: "월산동", name: "월산동" },
      { slug: "덕남동", name: "덕남동" },
      { slug: "행암동", name: "행암동" },
      { slug: "주월동", name: "주월동" },
      { slug: "승촌동", name: "승촌동" },
      { slug: "지석동", name: "지석동" },
      { slug: "압촌동", name: "압촌동" },
      { slug: "화장동", name: "화장동" },
      { slug: "칠석동", name: "칠석동" },
      { slug: "석정동", name: "석정동" },
      { slug: "신장동", name: "신장동" },
      { slug: "양과동", name: "양과동" },
      { slug: "이장동", name: "이장동" },
      { slug: "대지동", name: "대지동" },
      { slug: "송하동", name: "송하동" },
      { slug: "양림동", name: "양림동" },
      { slug: "방림동", name: "방림동" },
      { slug: "봉선동", name: "봉선동" },
      { slug: "구소동", name: "구소동" },
      { slug: "임암동", name: "임암동" },
      { slug: "원산동", name: "원산동" },
      { slug: "월성동", name: "월성동" },
      { slug: "사동", name: "사동" },
      { slug: "구동", name: "구동" },
      { slug: "남구", name: "남구" },
      { slug: "백운동", name: "백운동" },
      { slug: "노대동", name: "노대동" },
      { slug: "진월동", name: "진월동" },
      { slug: "양촌동", name: "양촌동" },
      { slug: "도금동", name: "도금동" }
    ] },
    { slug: "서구", name: "서구", nameEn: "", dongs: [
      { slug: "금호동", name: "금호동" },
      { slug: "마륵동", name: "마륵동" },
      { slug: "풍암동", name: "풍암동" },
      { slug: "치평동", name: "치평동" },
      { slug: "내방동", name: "내방동" },
      { slug: "서창동", name: "서창동" },
      { slug: "세하동", name: "세하동" },
      { slug: "용두동", name: "용두동" },
      { slug: "쌍촌동", name: "쌍촌동" },
      { slug: "화정동", name: "화정동" },
      { slug: "벽진동", name: "벽진동" },
      { slug: "유촌동", name: "유촌동" },
      { slug: "덕흥동", name: "덕흥동" },
      { slug: "서구", name: "서구" },
      { slug: "양동", name: "양동" },
      { slug: "농성동", name: "농성동" },
      { slug: "동천동", name: "동천동" },
      { slug: "매월동", name: "매월동" },
      { slug: "광천동", name: "광천동" }
    ] },
    { slug: "광산구", name: "광산구", nameEn: "", dongs: [
      { slug: "월전동", name: "월전동" },
      { slug: "장록동", name: "장록동" },
      { slug: "고룡동", name: "고룡동" },
      { slug: "신룡동", name: "신룡동" },
      { slug: "두정동", name: "두정동" },
      { slug: "임곡동", name: "임곡동" },
      { slug: "광산동", name: "광산동" },
      { slug: "오산동", name: "오산동" },
      { slug: "사호동", name: "사호동" },
      { slug: "하산동", name: "하산동" },
      { slug: "유계동", name: "유계동" },
      { slug: "본덕동", name: "본덕동" },
      { slug: "용봉동", name: "용봉동" },
      { slug: "요기동", name: "요기동" },
      { slug: "복룡동", name: "복룡동" },
      { slug: "송대동", name: "송대동" },
      { slug: "옥동", name: "옥동" },
      { slug: "지정동", name: "지정동" },
      { slug: "명화동", name: "명화동" },
      { slug: "쌍암동", name: "쌍암동" },
      { slug: "산월동", name: "산월동" },
      { slug: "신창동", name: "신창동" },
      { slug: "신가동", name: "신가동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "서봉동", name: "서봉동" },
      { slug: "운수동", name: "운수동" },
      { slug: "선암동", name: "선암동" },
      { slug: "소촌동", name: "소촌동" },
      { slug: "우산동", name: "우산동" },
      { slug: "신동", name: "신동" },
      { slug: "삼도동", name: "삼도동" },
      { slug: "남산동", name: "남산동" },
      { slug: "송치동", name: "송치동" },
      { slug: "산수동", name: "산수동" },
      { slug: "선동", name: "선동" },
      { slug: "지산동", name: "지산동" },
      { slug: "송산동", name: "송산동" },
      { slug: "산막동", name: "산막동" },
      { slug: "수완동", name: "수완동" },
      { slug: "동호동", name: "동호동" },
      { slug: "덕림동", name: "덕림동" },
      { slug: "양산동", name: "양산동" },
      { slug: "동림동", name: "동림동" },
      { slug: "오선동", name: "오선동" },
      { slug: "도호동", name: "도호동" },
      { slug: "송정동", name: "송정동" },
      { slug: "도산동", name: "도산동" },
      { slug: "운남동", name: "운남동" },
      { slug: "안청동", name: "안청동" },
      { slug: "연산동", name: "연산동" },
      { slug: "왕동", name: "왕동" },
      { slug: "북산동", name: "북산동" },
      { slug: "비아동", name: "비아동" },
      { slug: "도천동", name: "도천동" },
      { slug: "황룡동", name: "황룡동" },
      { slug: "박호동", name: "박호동" },
      { slug: "장덕동", name: "장덕동" },
      { slug: "월계동", name: "월계동" },
      { slug: "대산동", name: "대산동" },
      { slug: "송학동", name: "송학동" },
      { slug: "동산동", name: "동산동" },
      { slug: "오운동", name: "오운동" },
      { slug: "삼거동", name: "삼거동" },
      { slug: "양동", name: "양동" },
      { slug: "내산동", name: "내산동" },
      { slug: "송촌동", name: "송촌동" },
      { slug: "지죽동", name: "지죽동" },
      { slug: "용동", name: "용동" },
      { slug: "용곡동", name: "용곡동" },
      { slug: "흑석동", name: "흑석동" },
      { slug: "하남동", name: "하남동" },
      { slug: "장수동", name: "장수동" },
      { slug: "산정동", name: "산정동" },
      { slug: "월곡동", name: "월곡동" },
      { slug: "등임동", name: "등임동" },
      { slug: "도덕동", name: "도덕동" },
      { slug: "광산구", name: "광산구" },
      { slug: "진곡동", name: "진곡동" },
      { slug: "명도동", name: "명도동" },
      { slug: "지평동", name: "지평동" }
    ] },
    { slug: "동구", name: "동구", nameEn: "", dongs: [
      { slug: "황금동", name: "황금동" },
      { slug: "서석동", name: "서석동" },
      { slug: "소태동", name: "소태동" },
      { slug: "용연동", name: "용연동" },
      { slug: "운림동", name: "운림동" },
      { slug: "학동", name: "학동" },
      { slug: "월남동", name: "월남동" },
      { slug: "남동", name: "남동" },
      { slug: "광산동", name: "광산동" },
      { slug: "금동", name: "금동" },
      { slug: "호남동", name: "호남동" },
      { slug: "불로동", name: "불로동" },
      { slug: "계림동", name: "계림동" },
      { slug: "산수동", name: "산수동" },
      { slug: "궁동", name: "궁동" },
      { slug: "장동", name: "장동" },
      { slug: "동명동", name: "동명동" },
      { slug: "금남로3가", name: "금남로3가" },
      { slug: "대의동", name: "대의동" },
      { slug: "금남로5가", name: "금남로5가" },
      { slug: "충장로5가", name: "충장로5가" },
      { slug: "수기동", name: "수기동" },
      { slug: "지산동", name: "지산동" },
      { slug: "선교동", name: "선교동" },
      { slug: "내남동", name: "내남동" },
      { slug: "용산동", name: "용산동" },
      { slug: "금남로4가", name: "금남로4가" },
      { slug: "동구", name: "동구" },
      { slug: "대인동", name: "대인동" },
      { slug: "충장로1가", name: "충장로1가" },
      { slug: "충장로2가", name: "충장로2가" },
      { slug: "충장로3가", name: "충장로3가" },
      { slug: "충장로4가", name: "충장로4가" },
      { slug: "금남로1가", name: "금남로1가" },
      { slug: "금남로2가", name: "금남로2가" }
    ] }
  ],
    districtCount: 5,
    dongCount: 94,
    characteristics: {
      summary: "\uD638\uB0A8\uAD8C \uC911\uC2EC\uC9C0, \uBB38\uD654\xB7\uC608\uC220 \uB3C4\uC2DC\uC774\uBA70 \uC790\uB3D9\uCC28\xB7\uAD11 \uC0B0\uC5C5\uC758 \uAC70\uC810",
      storeTypes: ["\uBB38\uD654\xB7\uC608\uC220 \uCE74\uD398", "\uC804\uD1B5 \uC74C\uC2DD\uC810", "\uC790\uB3D9\uCC28 \uBD80\uD488\uC810", "\uB300\uD559\uAC00 \uB9E4\uC7A5"],
      customerBase: ["\uAD11\uC8FC \uC2DC\uBBFC", "\uC804\uB0A8 \uC9C0\uC5ED \uBC29\uBB38\uAC1D", "\uC790\uB3D9\uCC28 \uC0B0\uC5C5 \uC885\uC0AC\uC790", "\uBB38\uD654\xB7\uC608\uC220 \uAD00\uACC4\uC790"],
      businessHours: "\uD3C9\uC77C \uC800\uB141 6-10\uC2DC \uD53C\uD06C, \uC8FC\uB9D0 \uAC00\uC871\xB7\uBB38\uD654 \uD589\uC0AC \uACE0\uAC1D"
    },
    businessEnvironment: {
      majorIndustries: ["\uC790\uB3D9\uCC28\xB7\uBD80\uD488", "\uAD11 \uC0B0\uC5C5", "\uBB38\uD654\xB7\uC608\uC220", "\uC2DD\uD488 \uAC00\uACF5"],
      commercialAreas: ["\uCDA9\uC7A5\uB85C\xB7\uB3D9\uAD6C", "\uC0C1\uBB34\uC9C0\uAD6C\xB7\uC11C\uAD6C", "\uBD09\uC120\uB3D9\xB7\uB0A8\uAD6C", "\uCCA8\uB2E8\uACFC\uD559\uB2E8\uC9C0"],
      infrastructure: ["\uAD11\uC8FC\uC1A1\uC815\uC5ED KTX", "\uC9C0\uD558\uCCA0 1\uD638\uC120", "\uCCA8\uB2E8\uC0B0\uC5C5\uB2E8\uC9C0", "5\xB718 \uBBFC\uC8FC\uAD11\uC7A5"]
    },
    installationTips: [
      "\uC804\uD1B5 \uC74C\uC2DD\uC810\uC758 \uB2E4\uC591\uD55C \uACB0\uC81C \uC218\uB2E8 \uC9C0\uC6D0 \uD544\uC218",
      "\uBB38\uD654\xB7\uC608\uC220 \uB9E4\uC7A5\uC758 \uAC10\uC131\uC801 \uB514\uC790\uC778 \uC911\uC2DC",
      "\uC790\uB3D9\uCC28 \uC0B0\uC5C5 \uB2E8\uC9C0 \uC5F0\uACC4 B2B \uC194\uB8E8\uC158",
      "\uD638\uB0A8 \uD2B9\uC720\uC758 \uD478\uC9D0\uD55C \uC74C\uC2DD \uBB38\uD654 \uBC18\uC601\uD55C POS"
    ],
    featuredDistricts: [
      { name: "\uB3D9\uAD6C", description: "\uCDA9\uC7A5\uB85C \uC0C1\uAD8C, \uAD11\uC8FC \uC804\uD1B5 \uBC88\uD654\uAC00\uC640 \uC80A\uC740 \uAC10\uC131 \uB9E4\uC7A5" },
      { name: "\uC11C\uAD6C", description: "\uC0C1\uBB34\uC9C0\uAD6C, \uC2E0\uB3C4\uC2DC\uD615 \uD504\uB9AC\uBBF8\uC5C4 \uB9E4\uC7A5 \uC9D1\uC911" },
      { name: "\uBD81\uAD6C", description: "\uCCA8\uB2E8\uC9C0\uAD6C, \uCCA8\uB2E8\uC0B0\uC5C5\uB2E8\uC9C0\uC640 \uB300\uD559\uAC00 \uC5F0\uACC4" },
      { name: "\uAD11\uC0B0\uAD6C", description: "\uC218\uC644\uC9C0\uAD6C \uC2E0\uB3C4\uC2DC, \uC8FC\uAC70\uB2E8\uC9C0 \uC5F0\uACC4 \uC0DD\uD65C \uC0C1\uAD8C" }
    ]
  },
  // ========================================
  // 대전광역시
  // ========================================
  {
    code: "daejeon",
    nameKo: "\uB300\uC804\uAD11\uC5ED\uC2DC",
    nameKoShort: "\uB300\uC804",
    nameEn: "Daejeon",
    districts: [
    { slug: "유성구", name: "유성구", nameEn: "", dongs: [
      { slug: "봉명동", name: "봉명동" },
      { slug: "구암동", name: "구암동" },
      { slug: "원신흥동", name: "원신흥동" },
      { slug: "상대동", name: "상대동" },
      { slug: "장대동", name: "장대동" },
      { slug: "갑동", name: "갑동" },
      { slug: "노은동", name: "노은동" },
      { slug: "유성구", name: "유성구" },
      { slug: "원내동", name: "원내동" },
      { slug: "교촌동", name: "교촌동" },
      { slug: "대정동", name: "대정동" },
      { slug: "용계동", name: "용계동" },
      { slug: "학하동", name: "학하동" },
      { slug: "계산동", name: "계산동" },
      { slug: "성북동", name: "성북동" },
      { slug: "세동", name: "세동" },
      { slug: "송정동", name: "송정동" },
      { slug: "방동", name: "방동" },
      { slug: "탑립동", name: "탑립동" },
      { slug: "신봉동", name: "신봉동" },
      { slug: "수남동", name: "수남동" },
      { slug: "안산동", name: "안산동" },
      { slug: "외삼동", name: "외삼동" },
      { slug: "반석동", name: "반석동" },
      { slug: "문지동", name: "문지동" },
      { slug: "전민동", name: "전민동" },
      { slug: "원촌동", name: "원촌동" },
      { slug: "용산동", name: "용산동" },
      { slug: "봉산동", name: "봉산동" },
      { slug: "관평동", name: "관평동" },
      { slug: "송강동", name: "송강동" },
      { slug: "금고동", name: "금고동" },
      { slug: "대동", name: "대동" },
      { slug: "금탄동", name: "금탄동" },
      { slug: "신동", name: "신동" },
      { slug: "둔곡동", name: "둔곡동" },
      { slug: "구룡동", name: "구룡동" },
      { slug: "지족동", name: "지족동" },
      { slug: "죽동", name: "죽동" },
      { slug: "궁동", name: "궁동" },
      { slug: "어은동", name: "어은동" },
      { slug: "구성동", name: "구성동" },
      { slug: "신성동", name: "신성동" },
      { slug: "가정동", name: "가정동" },
      { slug: "복용동", name: "복용동" },
      { slug: "덕명동", name: "덕명동" },
      { slug: "도룡동", name: "도룡동" },
      { slug: "장동", name: "장동" },
      { slug: "방현동", name: "방현동" },
      { slug: "화암동", name: "화암동" },
      { slug: "하기동", name: "하기동" },
      { slug: "추목동", name: "추목동" },
      { slug: "자운동", name: "자운동" },
      { slug: "덕진동", name: "덕진동" }
    ] },
    { slug: "중구", name: "중구", nameEn: "", dongs: [
      { slug: "목달동", name: "목달동" },
      { slug: "정생동", name: "정생동" },
      { slug: "어남동", name: "어남동" },
      { slug: "금동", name: "금동" },
      { slug: "중구", name: "중구" },
      { slug: "은행동", name: "은행동" },
      { slug: "선화동", name: "선화동" },
      { slug: "목동", name: "목동" },
      { slug: "중촌동", name: "중촌동" },
      { slug: "문창동", name: "문창동" },
      { slug: "석교동", name: "석교동" },
      { slug: "호동", name: "호동" },
      { slug: "옥계동", name: "옥계동" },
      { slug: "대사동", name: "대사동" },
      { slug: "부사동", name: "부사동" },
      { slug: "용두동", name: "용두동" },
      { slug: "오류동", name: "오류동" },
      { slug: "태평동", name: "태평동" },
      { slug: "유천동", name: "유천동" },
      { slug: "구완동", name: "구완동" },
      { slug: "침산동", name: "침산동" },
      { slug: "대흥동", name: "대흥동" },
      { slug: "안영동", name: "안영동" },
      { slug: "무수동", name: "무수동" },
      { slug: "문화동", name: "문화동" },
      { slug: "산성동", name: "산성동" },
      { slug: "사정동", name: "사정동" }
    ] },
    { slug: "서구", name: "서구", nameEn: "", dongs: [
      { slug: "우명동", name: "우명동" },
      { slug: "원정동", name: "원정동" },
      { slug: "용촌동", name: "용촌동" },
      { slug: "서구", name: "서구" },
      { slug: "복수동", name: "복수동" },
      { slug: "변동", name: "변동" },
      { slug: "도마동", name: "도마동" },
      { slug: "괴정동", name: "괴정동" },
      { slug: "가장동", name: "가장동" },
      { slug: "내동", name: "내동" },
      { slug: "갈마동", name: "갈마동" },
      { slug: "괴곡동", name: "괴곡동" },
      { slug: "둔산동", name: "둔산동" },
      { slug: "매노동", name: "매노동" },
      { slug: "산직동", name: "산직동" },
      { slug: "장안동", name: "장안동" },
      { slug: "평촌동", name: "평촌동" },
      { slug: "오동", name: "오동" },
      { slug: "월평동", name: "월평동" },
      { slug: "정림동", name: "정림동" },
      { slug: "가수원동", name: "가수원동" },
      { slug: "도안동", name: "도안동" },
      { slug: "관저동", name: "관저동" },
      { slug: "흑석동", name: "흑석동" },
      { slug: "용문동", name: "용문동" },
      { slug: "탄방동", name: "탄방동" },
      { slug: "봉곡동", name: "봉곡동" },
      { slug: "만년동", name: "만년동" }
    ] },
    { slug: "대덕구", name: "대덕구", nameEn: "", dongs: [
      { slug: "석봉동", name: "석봉동" },
      { slug: "신일동", name: "신일동" },
      { slug: "덕암동", name: "덕암동" },
      { slug: "상서동", name: "상서동" },
      { slug: "평촌동", name: "평촌동" },
      { slug: "장동", name: "장동" },
      { slug: "법동", name: "법동" },
      { slug: "중리동", name: "중리동" },
      { slug: "비래동", name: "비래동" },
      { slug: "이현동", name: "이현동" },
      { slug: "갈전동", name: "갈전동" },
      { slug: "부수동", name: "부수동" },
      { slug: "와동", name: "와동" },
      { slug: "용호동", name: "용호동" },
      { slug: "대덕구", name: "대덕구" },
      { slug: "오정동", name: "오정동" },
      { slug: "대화동", name: "대화동" },
      { slug: "읍내동", name: "읍내동" },
      { slug: "황호동", name: "황호동" },
      { slug: "삼정동", name: "삼정동" },
      { slug: "미호동", name: "미호동" },
      { slug: "신탄진동", name: "신탄진동" },
      { slug: "목상동", name: "목상동" },
      { slug: "문평동", name: "문평동" },
      { slug: "송촌동", name: "송촌동" },
      { slug: "연축동", name: "연축동" },
      { slug: "신대동", name: "신대동" }
    ] },
    { slug: "동구", name: "동구", nameEn: "", dongs: [
      { slug: "신안동", name: "신안동" },
      { slug: "소제동", name: "소제동" },
      { slug: "가양동", name: "가양동" },
      { slug: "용전동", name: "용전동" },
      { slug: "성남동", name: "성남동" },
      { slug: "홍도동", name: "홍도동" },
      { slug: "삼성동", name: "삼성동" },
      { slug: "정동", name: "정동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "사성동", name: "사성동" },
      { slug: "내탑동", name: "내탑동" },
      { slug: "오동", name: "오동" },
      { slug: "주촌동", name: "주촌동" },
      { slug: "낭월동", name: "낭월동" },
      { slug: "대별동", name: "대별동" },
      { slug: "이사동", name: "이사동" },
      { slug: "대성동", name: "대성동" },
      { slug: "장척동", name: "장척동" },
      { slug: "소호동", name: "소호동" },
      { slug: "구도동", name: "구도동" },
      { slug: "삼괴동", name: "삼괴동" },
      { slug: "상소동", name: "상소동" },
      { slug: "하소동", name: "하소동" },
      { slug: "삼정동", name: "삼정동" },
      { slug: "용운동", name: "용운동" },
      { slug: "대동", name: "대동" },
      { slug: "추동", name: "추동" },
      { slug: "동구", name: "동구" },
      { slug: "원동", name: "원동" },
      { slug: "인동", name: "인동" },
      { slug: "효동", name: "효동" },
      { slug: "천동", name: "천동" },
      { slug: "가오동", name: "가오동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "중동", name: "중동" },
      { slug: "자양동", name: "자양동" },
      { slug: "비룡동", name: "비룡동" },
      { slug: "주산동", name: "주산동" },
      { slug: "용계동", name: "용계동" },
      { slug: "마산동", name: "마산동" },
      { slug: "효평동", name: "효평동" },
      { slug: "직동", name: "직동" },
      { slug: "세천동", name: "세천동" },
      { slug: "신상동", name: "신상동" },
      { slug: "신하동", name: "신하동" },
      { slug: "판암동", name: "판암동" }
    ] }
  ],
    districtCount: 5,
    dongCount: 76,
    characteristics: {
      summary: "\uACFC\uD559\xB7\uC5F0\uAD6C\uAC1C\uBC1C \uD2B9\uD654\uB41C \uC911\uBD80\uAD8C \uAC70\uC810 \uB3C4\uC2DC, \uACF5\uACF5\uAE30\uAD00\uACFC \uB300\uD559 \uC911\uC2EC",
      storeTypes: ["\uC5F0\uAD6C\uB2E8\uC9C0 \uCE74\uD398", "\uB300\uD559\uAC00 \uC2DD\uB2F9", "\uACF5\uACF5\uAE30\uAD00 \uC778\uADFC \uB9E4\uC7A5", "\uACFC\uD559\uAD00 \uC5F0\uACC4 \uB9E4\uC7A5"],
      customerBase: ["\uC5F0\uAD6C\uC6D0\xB7\uACF5\uBB34\uC6D0", "\uB300\uD559\uC0DD", "\uCD9C\uC7A5\xB7\uAD50\uD1B5 \uC774\uC6A9\uAC1D", "\uB300\uC804 \uC2DC\uBBFC"],
      businessHours: "\uD3C9\uC77C \uC810\uC2EC\xB7\uC800\uB141 \uC9D1\uC911, \uC5F0\uAD6C\uB2E8\uC9C0 \uD2B9\uC131\uC0C1 \uC57C\uADFC \uC218\uC694 \uB192\uC74C"
    },
    businessEnvironment: {
      majorIndustries: ["\uACFC\uD559\xB7\uC5F0\uAD6C", "\uAD50\uC721\xB7\uB300\uD559", "\uACF5\uACF5 \uC11C\uBE44\uC2A4", "IT\xB7\uBCA4\uCC98"],
      commercialAreas: ["\uB454\uC0B0\xB7\uC11C\uAD6C", "\uC720\uC131\uC628\uCC9C\xB7\uC720\uC131", "\uC740\uD589\uB3D9\xB7\uC911\uAD6C", "\uB300\uD559\uAC00 \uADFC\uCC98"],
      infrastructure: ["\uB300\uC804\uC5ED KTX \uD5C8\uBE0C", "\uB300\uB355\uC5F0\uAD6C\uB2E8\uC9C0", "KAIST\xB7\uCDA9\uB0A8\uB300", "\uC9C0\uD558\uCCA0 1\uD638\uC120"]
    },
    installationTips: [
      "\uC5F0\uAD6C\uB2E8\uC9C0 \uB9E4\uC7A5\uC758 \uC57C\uAC04 \uC6B4\uC601 \uB300\uC751 \uC2DC\uC2A4\uD15C",
      "\uB300\uD559\uAC00 \uB9E4\uC7A5\uC758 \uD559\uC0DD \uD560\uC778\xB7\uBA64\uBC84\uC2ED \uC5F0\uB3D9",
      "\uACF5\uACF5\uAE30\uAD00 \uC5F0\uACC4 B2B \uACB0\uC81C \uC2DC\uC2A4\uD15C",
      "\uAD50\uD1B5 \uC694\uCDA9\uC9C0 \uD2B9\uC131 \uD65C\uC6A9\uD55C \uD0DD\uBC30\xB7\uD53D\uC5C5 \uC5F0\uB3D9"
    ],
    featuredDistricts: [
      { name: "\uC720\uC131\uAD6C", description: "KAIST\xB7\uC5F0\uAD6C\uB2E8\uC9C0 \uC911\uC2EC, IT\xB7\uBCA4\uCC98 \uB9E4\uC7A5 \uC9D1\uC911" },
      { name: "\uC11C\uAD6C", description: "\uB454\uC0B0 \uC2E0\uB3C4\uC2EC, \uB300\uC804 \uCD5C\uB300 \uBC88\uD654\uAC00" },
      { name: "\uC911\uAD6C", description: "\uC740\uD589\uB3D9 \uC804\uD1B5 \uC0C1\uAD8C, \uB300\uC804\uC758 \uC6D0\uB3C4\uC2EC" },
      { name: "\uB300\uB355\uAD6C", description: "\uB300\uB355\uC5F0\uAD6C\uB2E8\uC9C0, \uCCA8\uB2E8 \uACFC\uD559 \uC5F0\uACC4 \uB9E4\uC7A5" }
    ]
  },
  // ========================================
  // 울산광역시
  // ========================================
  {
    code: "ulsan",
    nameKo: "\uC6B8\uC0B0\uAD11\uC5ED\uC2DC",
    nameKoShort: "\uC6B8\uC0B0",
    nameEn: "Ulsan",
    districts: [
    { slug: "남구", name: "남구", nameEn: "", dongs: [
      { slug: "신정동", name: "신정동" },
      { slug: "달동", name: "달동" },
      { slug: "용연동", name: "용연동" },
      { slug: "남화동", name: "남화동" },
      { slug: "용잠동", name: "용잠동" },
      { slug: "장생포동", name: "장생포동" },
      { slug: "남구", name: "남구" },
      { slug: "무거동", name: "무거동" },
      { slug: "옥동", name: "옥동" },
      { slug: "두왕동", name: "두왕동" },
      { slug: "삼산동", name: "삼산동" },
      { slug: "여천동", name: "여천동" },
      { slug: "야음동", name: "야음동" },
      { slug: "선암동", name: "선암동" },
      { slug: "상개동", name: "상개동" },
      { slug: "부곡동", name: "부곡동" },
      { slug: "매암동", name: "매암동" },
      { slug: "고사동", name: "고사동" },
      { slug: "성암동", name: "성암동" },
      { slug: "황성동", name: "황성동" }
    ] },
    { slug: "울주군", name: "울주군", nameEn: "", dongs: [
      { slug: "두동면", name: "두동면" },
      { slug: "웅촌면", name: "웅촌면" },
      { slug: "언양읍", name: "언양읍" },
      { slug: "온양읍", name: "온양읍" },
      { slug: "청량읍", name: "청량읍" },
      { slug: "삼동면", name: "삼동면" },
      { slug: "범서읍", name: "범서읍" },
      { slug: "온산읍", name: "온산읍" },
      { slug: "울주군", name: "울주군" },
      { slug: "두서면", name: "두서면" },
      { slug: "서생면", name: "서생면" },
      { slug: "삼남읍", name: "삼남읍" },
      { slug: "상북면", name: "상북면" },
      { slug: "삼남면", name: "삼남면" },
      { slug: "청량면", name: "청량면" }
    ] },
    { slug: "북구", name: "북구", nameEn: "", dongs: [
      { slug: "효문동", name: "효문동" },
      { slug: "양정동", name: "양정동" },
      { slug: "화봉동", name: "화봉동" },
      { slug: "연암동", name: "연암동" },
      { slug: "무룡동", name: "무룡동" },
      { slug: "구유동", name: "구유동" },
      { slug: "정자동", name: "정자동" },
      { slug: "신명동", name: "신명동" },
      { slug: "신천동", name: "신천동" },
      { slug: "중산동", name: "중산동" },
      { slug: "상안동", name: "상안동" },
      { slug: "천곡동", name: "천곡동" },
      { slug: "대안동", name: "대안동" },
      { slug: "당사동", name: "당사동" },
      { slug: "신현동", name: "신현동" },
      { slug: "산하동", name: "산하동" },
      { slug: "어물동", name: "어물동" },
      { slug: "명촌동", name: "명촌동" },
      { slug: "염포동", name: "염포동" },
      { slug: "달천동", name: "달천동" },
      { slug: "시례동", name: "시례동" },
      { slug: "진장동", name: "진장동" },
      { slug: "북구", name: "북구" },
      { slug: "창평동", name: "창평동" },
      { slug: "호계동", name: "호계동" },
      { slug: "매곡동", name: "매곡동" },
      { slug: "가대동", name: "가대동" },
      { slug: "송정동", name: "송정동" }
    ] },
    { slug: "중구", name: "중구", nameEn: "", dongs: [
      { slug: "학산동", name: "학산동" },
      { slug: "반구동", name: "반구동" },
      { slug: "중구", name: "중구" },
      { slug: "학성동", name: "학성동" },
      { slug: "복산동", name: "복산동" },
      { slug: "북정동", name: "북정동" },
      { slug: "옥교동", name: "옥교동" },
      { slug: "성남동", name: "성남동" },
      { slug: "교동", name: "교동" },
      { slug: "우정동", name: "우정동" },
      { slug: "성안동", name: "성안동" },
      { slug: "유곡동", name: "유곡동" },
      { slug: "태화동", name: "태화동" },
      { slug: "다운동", name: "다운동" },
      { slug: "동동", name: "동동" },
      { slug: "서동", name: "서동" },
      { slug: "남외동", name: "남외동" },
      { slug: "장현동", name: "장현동" },
      { slug: "약사동", name: "약사동" }
    ] },
    { slug: "동구", name: "동구", nameEn: "", dongs: [
      { slug: "주전동", name: "주전동" },
      { slug: "동부동", name: "동부동" },
      { slug: "화정동", name: "화정동" },
      { slug: "일산동", name: "일산동" },
      { slug: "전하동", name: "전하동" },
      { slug: "미포동", name: "미포동" },
      { slug: "동구", name: "동구" },
      { slug: "방어동", name: "방어동" },
      { slug: "서부동", name: "서부동" }
    ] }
  ],
    districtCount: 5,
    dongCount: 56,
    characteristics: {
      summary: "\uC790\uB3D9\uCC28\xB7\uC870\uC120\xB7\uC11D\uC720\uD654\uD559 \uC0B0\uC5C5\uC758 \uC138\uACC4\uC801 \uD5C8\uBE0C, \uC0B0\uC5C5 \uADFC\uB85C\uC790 \uC911\uC2EC \uC0C1\uAD8C",
      storeTypes: ["\uC0B0\uC5C5\uB2E8\uC9C0 \uC778\uADFC \uC2DD\uB2F9", "\uADFC\uB85C\uC790 \uC219\uC18C \uCE74\uD398", "\uC790\uB3D9\uCC28 \uBD80\uD488 \uB9E4\uC7A5", "\uC870\uC120\uC18C \uC5F0\uACC4 \uC2DD\uB2F9"],
      customerBase: ["\uC911\uACF5\uC5C5 \uADFC\uB85C\uC790", "\uC6B8\uC0B0 \uC2DC\uBBFC", "\uCD9C\uC7A5 \uAE30\uC220\uC790", "\uC678\uAD6D\uC778 \uC5D4\uC9C0\uB2C8\uC5B4"],
      businessHours: "3\uAD50\uB300 \uADFC\uBB34 \uB300\uC751 24\uC2DC\uAC04 \uC6B4\uC601, \uC810\uC2EC\uC2DC\uAC04 \uC9D1\uC911 \uC218\uC694"
    },
    businessEnvironment: {
      majorIndustries: ["\uC790\uB3D9\uCC28\xB7\uD604\uB300\uC790\uB3D9\uCC28", "\uC870\uC120\xB7\uD604\uB300\uC911\uACF5\uC5C5", "\uC11D\uC720\uD654\uD559", "\uBE44\uCCA0\uAE08\uC18D"],
      commercialAreas: ["\uC0BC\uC0B0\uB3D9\xB7\uB0A8\uAD6C", "\uC131\uB0A8\uB3D9\xB7\uC911\uAD6C", "\uBC29\uC5B4\uC9C4\xB7\uB3D9\uAD6C", "\uC6B8\uC8FC\uAD70 \uC5B8\uC591"],
      infrastructure: ["\uC6B8\uC0B0\uD56D \uBB3C\uB958", "KTX \uC6B8\uC0B0\uC5ED", "\uBBF8\uD3EC\xB7\uC628\uC0B0 \uC0B0\uC5C5\uB2E8\uC9C0", "\uACE0\uC18D\uB3C4\uB85C \uC9D1\uC911"]
    },
    installationTips: [
      "3\uAD50\uB300 \uADFC\uB85C\uC790 \uB300\uC751 24\uC2DC\uAC04 \uBB34\uC778 \uB9E4\uC7A5 \uAD6C\uCD95",
      "\uC678\uAD6D\uC778 \uC5D4\uC9C0\uB2C8\uC5B4 \uB300\uC0C1 \uB2E4\uAD6D\uC5B4(\uD55C\xB7\uC601\xB7\uBCA0\uD2B8\uB0A8\xB7\uD544\uB9AC\uD540) \uC9C0\uC6D0",
      "\uC0B0\uC5C5\uB2E8\uC9C0 \uC778\uADFC \uB300\uB7C9 \uC8FC\uBB38 \uCC98\uB9AC \uC2DC\uC2A4\uD15C",
      "\uADFC\uB85C\uC790 \uC2DD\uB2F9\uC758 \uD68C\uC0AC \uBC95\uC778\uCE74\uB4DC \uC5F0\uB3D9 \uACB0\uC81C"
    ],
    featuredDistricts: [
      { name: "\uB0A8\uAD6C", description: "\uC0BC\uC0B0\uB3D9 \uC911\uC2EC\uC0C1\uAD8C, \uC6B8\uC0B0 \uCD5C\uB300 \uBC88\uD654\uAC00" },
      { name: "\uC911\uAD6C", description: "\uC131\uB0A8\uB3D9 \uC6D0\uB3C4\uC2EC, \uC804\uD1B5 \uC2DC\uC7A5\uACFC \uBB38\uD654\uC758 \uAC70\uB9AC" },
      { name: "\uB3D9\uAD6C", description: "\uD604\uB300\uC911\uACF5\uC5C5 \uC5F0\uACC4, \uC870\uC120 \uADFC\uB85C\uC790 \uB300\uC0C1 \uC0C1\uAD8C" },
      { name: "\uBD81\uAD6C", description: "\uD604\uB300\uC790\uB3D9\uCC28 \uC6B8\uC0B0\uACF5\uC7A5, \uC0B0\uC5C5 \uC5F0\uACC4 \uB9E4\uC7A5" }
    ]
  },
  // ========================================
  // 세종특별자치시
  // ========================================
  {
    code: "sejong",
    nameKo: "\uC138\uC885\uD2B9\uBCC4\uC790\uCE58\uC2DC",
    nameKoShort: "\uC138\uC885",
    nameEn: "Sejong",
    districts: [
    { slug: "세종시", name: "세종시", nameEn: "", dongs: [
      { slug: "전동면", name: "전동면" },
      { slug: "전의면", name: "전의면" },
      { slug: "조치원읍", name: "조치원읍" },
      { slug: "연서면", name: "연서면" },
      { slug: "세종동", name: "세종동" },
      { slug: "누리동", name: "누리동" },
      { slug: "한별동", name: "한별동" },
      { slug: "연동면", name: "연동면" },
      { slug: "반곡동", name: "반곡동" },
      { slug: "합강동", name: "합강동" },
      { slug: "집현동", name: "집현동" },
      { slug: "다솜동", name: "다솜동" },
      { slug: "용호동", name: "용호동" },
      { slug: "부강면", name: "부강면" },
      { slug: "금남면", name: "금남면" },
      { slug: "연기면", name: "연기면" },
      { slug: "장군면", name: "장군면" },
      { slug: "산울동", name: "산울동" },
      { slug: "해밀동", name: "해밀동" },
      { slug: "소정면", name: "소정면" },
      { slug: "소담동", name: "소담동" },
      { slug: "보람동", name: "보람동" },
      { slug: "대평동", name: "대평동" },
      { slug: "가람동", name: "가람동" },
      { slug: "한솔동", name: "한솔동" },
      { slug: "나성동", name: "나성동" },
      { slug: "새롬동", name: "새롬동" },
      { slug: "다정동", name: "다정동" },
      { slug: "어진동", name: "어진동" },
      { slug: "종촌동", name: "종촌동" },
      { slug: "고운동", name: "고운동" },
      { slug: "아름동", name: "아름동" },
      { slug: "도담동", name: "도담동" },
      { slug: "세종시", name: "세종시" }
    ] }
  ],
    districtCount: 1,
    dongCount: 22,
    characteristics: {
      summary: "\uD589\uC815\uC911\uC2EC\uBCF5\uD569\uB3C4\uC2DC, \uACF5\uBB34\uC6D0 \uAC00\uC871\uACFC \uC2E0\uB3C4\uC2DC\uD615 \uD504\uB9AC\uBBF8\uC5C4 \uC0C1\uAD8C",
      storeTypes: ["\uC2E0\uB3C4\uC2DC \uCE74\uD398\xB7\uBCA0\uC774\uCEE4\uB9AC", "\uACF5\uBB34\uC6D0 \uC2DD\uB2F9", "\uC544\uD30C\uD2B8 \uB2E8\uC9C0 \uC0C1\uAC00", "\uD0A4\uC988\uCE74\uD398"],
      customerBase: ["\uACF5\uBB34\uC6D0 \uAC00\uC871", "\uC911\uC559\uBD80\uCC98 \uADFC\uBB34\uC790", "\uC2E0\uD63C\uBD80\uBD80\xB7\uC80A\uC740 \uAC00\uC871", "\uC138\uC885\uB300\uC655 \uAD00\uAD11\uAC1D"],
      businessHours: "\uD3C9\uC77C \uC810\uC2EC\xB7\uC800\uB141 \uC9D1\uC911, \uC8FC\uB9D0 \uAC00\uC871 \uB2E8\uC704 \uACE0\uAC1D \uB300\uAC70 \uBC29\uBB38"
    },
    businessEnvironment: {
      majorIndustries: ["\uACF5\uACF5 \uD589\uC815", "\uAD50\uC721\xB7\uC721\uC544", "\uC0DD\uD65C \uC11C\uBE44\uC2A4", "\uAC74\uC124\xB7\uBD80\uB3D9\uC0B0"],
      commercialAreas: ["\uC815\uBD80\uC138\uC885\uCCAD\uC0AC \uC8FC\uBCC0", "\uD55C\uC194\uB3D9\xB7\uB3C4\uB2F4\uB3D9 \uC0C1\uAC00", "\uC544\uB984\uB3D9 \uC911\uC559\uACF5\uC6D0", "\uC0C8\uB86C\uB3D9 \uC2E0\uB3C4\uC2DC"],
      infrastructure: ["\uC815\uBD80\uC138\uC885\uCCAD\uC0AC", "KTX \uC624\uC1A1\uC5ED \uC5F0\uACC4", "BRT \uAC04\uC120\uAE09\uD589\uBC84\uC2A4", "\uC2E0\uB3C4\uC2DC \uC2A4\uB9C8\uD2B8 \uC778\uD504\uB77C"]
    },
    installationTips: [
      "\uACF5\uBB34\uC6D0 \uBC95\uC778\uCE74\uB4DC \uACB0\uC81C \uC2DC\uC2A4\uD15C \uC5F0\uB3D9 \uD544\uC218",
      "\uC2E0\uCD95 \uC0C1\uAC00 \uD2B9\uC131 \uACE0\uB824\uD55C \uCD5C\uC2E0 IT \uC778\uD504\uB77C \uD65C\uC6A9",
      "\uAC00\uC871 \uB2E8\uC704 \uACE0\uAC1D \uBC30\uB824\uD55C \uD0A4\uC988\uC874\xB7\uC720\uBAA8\uCC28 \uC811\uADFC\uC131",
      "\uC138\uC885\uC2DC \uD2B9\uBCC4 \uB9C8\uC77C\uB9AC\uC9C0\xB7\uC0C1\uD488\uAD8C \uC5F0\uB3D9 POS"
    ],
    featuredDistricts: [
      { name: "\uD55C\uC194\uB3D9", description: "\uC138\uC885\uC2DC 1\uC0DD\uD65C\uAD8C, \uCCAB \uC785\uC8FC \uB2E8\uC9C0\uC640 \uC911\uC2EC \uC0C1\uAD8C" },
      { name: "\uB3C4\uB2F4\uB3D9", description: "\uD589\uBCF5\uB3C4\uC2DC 1\uC0DD\uD65C\uAD8C, \uC815\uBD80\uCCAD\uC0AC \uADFC\uC811 \uD504\uB9AC\uBBF8\uC5C4 \uB9E4\uC7A5" },
      { name: "\uC544\uB984\uB3D9", description: "\uC911\uC559\uACF5\uC6D0 \uC778\uADFC, \uAC00\uC871 \uCE5C\uD654\uC801 \uB9E4\uC7A5 \uC9D1\uC911" },
      { name: "\uC0C8\uB86C\uB3D9", description: "2\uC0DD\uD65C\uAD8C \uC2E0\uB3C4\uC2DC, \uC80A\uC740 \uC138\uB300 \uD0C0\uAC9F \uD2B8\uB80C\uB514 \uC0C1\uAD8C" }
    ]
  },
  // ========================================
  // 제주특별자치도
  // ========================================
  {
    code: "jeju",
    nameKo: "\uC81C\uC8FC\uD2B9\uBCC4\uC790\uCE58\uB3C4",
    nameKoShort: "\uC81C\uC8FC",
    nameEn: "Jeju",
    districts: [
    { slug: "제주시", name: "제주시", nameEn: "", dongs: [
      { slug: "해안동", name: "해안동" },
      { slug: "내도동", name: "내도동" },
      { slug: "아라일동", name: "아라일동" },
      { slug: "구좌읍", name: "구좌읍" },
      { slug: "한경면", name: "한경면" },
      { slug: "아라이동", name: "아라이동" },
      { slug: "오라일동", name: "오라일동" },
      { slug: "오라이동", name: "오라이동" },
      { slug: "제주시", name: "제주시" },
      { slug: "일도일동", name: "일도일동" },
      { slug: "노형동", name: "노형동" },
      { slug: "외도일동", name: "외도일동" },
      { slug: "영평동", name: "영평동" },
      { slug: "연동", name: "연동" },
      { slug: "도평동", name: "도평동" },
      { slug: "우도면", name: "우도면" },
      { slug: "일도이동", name: "일도이동" },
      { slug: "이도일동", name: "이도일동" },
      { slug: "이도이동", name: "이도이동" },
      { slug: "월평동", name: "월평동" },
      { slug: "오라삼동", name: "오라삼동" },
      { slug: "삼도이동", name: "삼도이동" },
      { slug: "건입동", name: "건입동" },
      { slug: "용담일동", name: "용담일동" },
      { slug: "용담이동", name: "용담이동" },
      { slug: "용담삼동", name: "용담삼동" },
      { slug: "화북일동", name: "화북일동" },
      { slug: "화북이동", name: "화북이동" },
      { slug: "삼양일동", name: "삼양일동" },
      { slug: "삼양이동", name: "삼양이동" },
      { slug: "삼양삼동", name: "삼양삼동" },
      { slug: "봉개동", name: "봉개동" },
      { slug: "외도이동", name: "외도이동" },
      { slug: "이호일동", name: "이호일동" },
      { slug: "이호이동", name: "이호이동" },
      { slug: "도두일동", name: "도두일동" },
      { slug: "도두이동", name: "도두이동" },
      { slug: "도남동", name: "도남동" },
      { slug: "도련일동", name: "도련일동" },
      { slug: "도련이동", name: "도련이동" },
      { slug: "용강동", name: "용강동" },
      { slug: "회천동", name: "회천동" },
      { slug: "오등동", name: "오등동" },
      { slug: "한림읍", name: "한림읍" },
      { slug: "삼도일동", name: "삼도일동" },
      { slug: "추자면", name: "추자면" },
      { slug: "조천읍", name: "조천읍" },
      { slug: "애월읍", name: "애월읍" }
    ] },
    { slug: "서귀포시", name: "서귀포시", nameEn: "", dongs: [
      { slug: "남원읍", name: "남원읍" },
      { slug: "신효동", name: "신효동" },
      { slug: "보목동", name: "보목동" },
      { slug: "법환동", name: "법환동" },
      { slug: "서호동", name: "서호동" },
      { slug: "호근동", name: "호근동" },
      { slug: "동홍동", name: "동홍동" },
      { slug: "성산읍", name: "성산읍" },
      { slug: "서홍동", name: "서홍동" },
      { slug: "상효동", name: "상효동" },
      { slug: "하효동", name: "하효동" },
      { slug: "표선면", name: "표선면" },
      { slug: "서귀동", name: "서귀동" },
      { slug: "서귀포시", name: "서귀포시" },
      { slug: "토평동", name: "토평동" },
      { slug: "중문동", name: "중문동" },
      { slug: "회수동", name: "회수동" },
      { slug: "대포동", name: "대포동" },
      { slug: "월평동", name: "월평동" },
      { slug: "강정동", name: "강정동" },
      { slug: "도순동", name: "도순동" },
      { slug: "하원동", name: "하원동" },
      { slug: "색달동", name: "색달동" },
      { slug: "상예동", name: "상예동" },
      { slug: "하예동", name: "하예동" },
      { slug: "영남동", name: "영남동" },
      { slug: "대정읍", name: "대정읍" },
      { slug: "안덕면", name: "안덕면" }
    ] }
  ],
    districtCount: 2,
    dongCount: 43,
    characteristics: {
      summary: "\uAD6D\uC81C \uAD00\uAD11 \uC12C, \uCC9C\uD61C\uC758 \uC790\uC5F0\uD658\uACBD\uACFC \uAC10\uADE4\xB7\uC218\uC0B0\uC5C5 \uD2B9\uD654 \uC9C0\uC5ED",
      storeTypes: ["\uAD00\uAD11\uC9C0 \uCE74\uD398\xB7\uB808\uC2A4\uD1A0\uB791", "\uD574\uC0B0\uBB3C \uC2DD\uB2F9", "\uAE30\uB150\uD488\uC810", "\uD39C\uC158\xB7\uC219\uBC15\uC5C5"],
      customerBase: ["\uAD6D\uB0B4\uC678 \uAD00\uAD11\uAC1D", "\uC81C\uC8FC \uB3C4\uBBFC", "\uC218\uC0B0\uC5C5\xB7\uB18D\uC5C5 \uC885\uC0AC\uC790", "\uC774\uC8FC\uBBFC\xB7\uADC0\uC5B4\xB7\uADC0\uCD0C"],
      businessHours: "\uAD00\uAD11 \uC131\uC218\uAE30(4~10\uC6D4) \uC2EC\uC57C \uC6B4\uC601, \uBE44\uC218\uAE30 \uB2E8\uCD95 \uC6B4\uC601"
    },
    businessEnvironment: {
      majorIndustries: ["\uAD00\uAD11\xB7\uC219\uBC15", "\uC218\uC0B0\xB7\uD574\uC0B0\uBB3C", "\uAC10\uADE4\xB7\uB18D\uC5C5", "\uBA74\uC138\xB7\uC1FC\uD551"],
      commercialAreas: ["\uC81C\uC8FC\uACF5\uD56D\xB7\uC5F0\uB3D9", "\uC911\uBB38\uAD00\uAD11\uB2E8\uC9C0", "\uC131\uC0B0\uC77C\uCD9C\uBD09", "\uC11C\uADC0\uD3EC \uC62C\uB808\uC2DC\uC7A5"],
      infrastructure: ["\uC81C\uC8FC\uAD6D\uC81C\uACF5\uD56D", "\uD574\uC800\uCF00\uC774\uBE14 \uAD11\uD1B5\uC2E0", "\uD06C\uB8E8\uC988 \uD130\uBBF8\uB110", "\uC62C\uB808\uAE38 \uAD00\uAD11 \uC778\uD504\uB77C"]
    },
    installationTips: [
      "\uD574\uC548\uAC00 \uC5FC\uBD84\xB7\uC2B5\uB3C4 \uB300\uC751 \uBC29\uC218\xB7\uBC29\uCCAD \uD2B9\uC218 \uC7A5\uBE44",
      "\uC911\uAD6D\uC778\xB7\uC77C\uBCF8\uC778 \uAD00\uAD11\uAC1D \uB300\uC0C1 \uB2E4\uAD6D\uC5B4\xB7\uB2E4\uD1B5\uD654 \uACB0\uC81C",
      "\uAD00\uAD11 \uC131\uC218\uAE30\xB7\uBE44\uC218\uAE30 \uB9E4\uCD9C \uCC28\uC774 \uB300\uC751 \uD655\uC7A5\uD615",
      "\uC81C\uC8FC \uD2B9\uC0B0\uD488 \uC5F0\uB3D9 \uB9C8\uC77C\uB9AC\uC9C0\xB7\uC0C1\uD488\uAD8C \uC2DC\uC2A4\uD15C"
    ],
    featuredDistricts: [
      { name: "\uC81C\uC8FC\uC2DC", description: "\uC81C\uC8FC\uACF5\uD56D\xB7\uC5F0\uB3D9\xB7\uB178\uD615 \uC911\uC2EC \uC0C1\uAD8C, \uAD00\uAD11\uACFC \uC0DD\uD65C \uACF5\uC874" },
      { name: "\uC11C\uADC0\uD3EC\uC2DC", description: "\uC911\uBB38\uAD00\uAD11\uB2E8\uC9C0\xB7\uC62C\uB808\uC2DC\uC7A5, \uAD00\uAD11\uC9C0 \uD2B9\uD654 \uB9E4\uC7A5" }
    ]
  },
  // ========================================
  // 강원특별자치도
  // ========================================
  {
    code: "gangwon",
    nameKo: "\uAC15\uC6D0\uD2B9\uBCC4\uC790\uCE58\uB3C4",
    nameKoShort: "\uAC15\uC6D0",
    nameEn: "Gangwon",
    districts: [
    { slug: "춘천시", name: "춘천시", nameEn: "", dongs: [
      { slug: "사농동", name: "사농동" },
      { slug: "남산면", name: "남산면" },
      { slug: "요선동", name: "요선동" },
      { slug: "낙원동", name: "낙원동" },
      { slug: "중앙로1가", name: "중앙로1가" },
      { slug: "중앙로2가", name: "중앙로2가" },
      { slug: "동면", name: "동면" },
      { slug: "효자동", name: "효자동" },
      { slug: "동산면", name: "동산면" },
      { slug: "후평동", name: "후평동" },
      { slug: "북산면", name: "북산면" },
      { slug: "중도동", name: "중도동" },
      { slug: "소양로1가", name: "소양로1가" },
      { slug: "소양로2가", name: "소양로2가" },
      { slug: "서면", name: "서면" },
      { slug: "동내면", name: "동내면" },
      { slug: "사북면", name: "사북면" },
      { slug: "춘천시", name: "춘천시" },
      { slug: "봉의동", name: "봉의동" },
      { slug: "송암동", name: "송암동" },
      { slug: "신동", name: "신동" },
      { slug: "옥천동", name: "옥천동" },
      { slug: "조양동", name: "조양동" },
      { slug: "죽림동", name: "죽림동" },
      { slug: "운교동", name: "운교동" },
      { slug: "약사동", name: "약사동" },
      { slug: "온의동", name: "온의동" },
      { slug: "교동", name: "교동" },
      { slug: "퇴계동", name: "퇴계동" },
      { slug: "소양로3가", name: "소양로3가" },
      { slug: "소양로4가", name: "소양로4가" },
      { slug: "근화동", name: "근화동" },
      { slug: "우두동", name: "우두동" },
      { slug: "석사동", name: "석사동" },
      { slug: "삼천동", name: "삼천동" },
      { slug: "칠전동", name: "칠전동" },
      { slug: "신동면", name: "신동면" },
      { slug: "남면", name: "남면" },
      { slug: "중앙로3가", name: "중앙로3가" },
      { slug: "신북읍", name: "신북읍" }
    ] },
    { slug: "태백시", name: "태백시", nameEn: "", dongs: [
      { slug: "화전동", name: "화전동" },
      { slug: "태백시", name: "태백시" },
      { slug: "혈동", name: "혈동" },
      { slug: "소도동", name: "소도동" },
      { slug: "적각동", name: "적각동" },
      { slug: "창죽동", name: "창죽동" },
      { slug: "통동", name: "통동" },
      { slug: "백산동", name: "백산동" },
      { slug: "원동", name: "원동" },
      { slug: "상사미동", name: "상사미동" },
      { slug: "문곡동", name: "문곡동" },
      { slug: "동점동", name: "동점동" },
      { slug: "황지동", name: "황지동" },
      { slug: "장성동", name: "장성동" },
      { slug: "금천동", name: "금천동" },
      { slug: "철암동", name: "철암동" },
      { slug: "하사미동", name: "하사미동" },
      { slug: "조탄동", name: "조탄동" }
    ] },
    { slug: "인제군", name: "인제군", nameEn: "", dongs: [
      { slug: "서화면", name: "서화면" },
      { slug: "기린면", name: "기린면" },
      { slug: "북면", name: "북면" },
      { slug: "상남면", name: "상남면" },
      { slug: "인제군", name: "인제군" },
      { slug: "인제읍", name: "인제읍" },
      { slug: "남면", name: "남면" }
    ] },
    { slug: "원주시", name: "원주시", nameEn: "", dongs: [
      { slug: "가현동", name: "가현동" },
      { slug: "문막읍", name: "문막읍" },
      { slug: "원주시", name: "원주시" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "흥업면", name: "흥업면" },
      { slug: "반곡동", name: "반곡동" },
      { slug: "신림면", name: "신림면" },
      { slug: "귀래면", name: "귀래면" },
      { slug: "부론면", name: "부론면" },
      { slug: "지정면", name: "지정면" },
      { slug: "소초면", name: "소초면" },
      { slug: "단구동", name: "단구동" },
      { slug: "일산동", name: "일산동" },
      { slug: "학성동", name: "학성동" },
      { slug: "단계동", name: "단계동" },
      { slug: "명륜동", name: "명륜동" },
      { slug: "원동", name: "원동" },
      { slug: "인동", name: "인동" },
      { slug: "호저면", name: "호저면" },
      { slug: "판부면", name: "판부면" },
      { slug: "행구동", name: "행구동" },
      { slug: "무실동", name: "무실동" },
      { slug: "관설동", name: "관설동" },
      { slug: "태장동", name: "태장동" },
      { slug: "봉산동", name: "봉산동" },
      { slug: "평원동", name: "평원동" },
      { slug: "우산동", name: "우산동" },
      { slug: "개운동", name: "개운동" }
    ] },
    { slug: "양양군", name: "양양군", nameEn: "", dongs: [
      { slug: "서면", name: "서면" },
      { slug: "양양군", name: "양양군" },
      { slug: "양양읍", name: "양양읍" },
      { slug: "현남면", name: "현남면" },
      { slug: "현북면", name: "현북면" },
      { slug: "강현면", name: "강현면" },
      { slug: "손양면", name: "손양면" }
    ] },
    { slug: "철원군", name: "철원군", nameEn: "", dongs: [
      { slug: "철원군", name: "철원군" },
      { slug: "철원읍", name: "철원읍" },
      { slug: "근동면", name: "근동면" },
      { slug: "원동면", name: "원동면" },
      { slug: "김화읍", name: "김화읍" },
      { slug: "갈말읍", name: "갈말읍" },
      { slug: "원남면", name: "원남면" },
      { slug: "임남면", name: "임남면" },
      { slug: "근북면", name: "근북면" },
      { slug: "서면", name: "서면" },
      { slug: "근남면", name: "근남면" },
      { slug: "동송읍", name: "동송읍" }
    ] },
    { slug: "삼척시", name: "삼척시", nameEn: "", dongs: [
      { slug: "건지동", name: "건지동" },
      { slug: "원당동", name: "원당동" },
      { slug: "성남동", name: "성남동" },
      { slug: "남양동", name: "남양동" },
      { slug: "가곡면", name: "가곡면" },
      { slug: "원덕읍", name: "원덕읍" },
      { slug: "마달동", name: "마달동" },
      { slug: "자원동", name: "자원동" },
      { slug: "평전동", name: "평전동" },
      { slug: "등봉동", name: "등봉동" },
      { slug: "도경동", name: "도경동" },
      { slug: "마평동", name: "마평동" },
      { slug: "오사동", name: "오사동" },
      { slug: "미로면", name: "미로면" },
      { slug: "신기면", name: "신기면" },
      { slug: "삼척시", name: "삼척시" },
      { slug: "성내동", name: "성내동" },
      { slug: "성북동", name: "성북동" },
      { slug: "읍상동", name: "읍상동" },
      { slug: "읍중동", name: "읍중동" },
      { slug: "당저동", name: "당저동" },
      { slug: "교동", name: "교동" },
      { slug: "갈천동", name: "갈천동" },
      { slug: "증산동", name: "증산동" },
      { slug: "우지동", name: "우지동" },
      { slug: "하장면", name: "하장면" },
      { slug: "정하동", name: "정하동" },
      { slug: "근산동", name: "근산동" },
      { slug: "도계읍", name: "도계읍" },
      { slug: "조비동", name: "조비동" },
      { slug: "정상동", name: "정상동" },
      { slug: "근덕면", name: "근덕면" },
      { slug: "오분동", name: "오분동" },
      { slug: "적노동", name: "적노동" },
      { slug: "사직동", name: "사직동" },
      { slug: "노곡면", name: "노곡면" }
    ] },
    { slug: "강릉시", name: "강릉시", nameEn: "", dongs: [
      { slug: "초당동", name: "초당동" },
      { slug: "강문동", name: "강문동" },
      { slug: "송정동", name: "송정동" },
      { slug: "옥천동", name: "옥천동" },
      { slug: "교동", name: "교동" },
      { slug: "사천면", name: "사천면" },
      { slug: "강릉시", name: "강릉시" },
      { slug: "포남동", name: "포남동" },
      { slug: "저동", name: "저동" },
      { slug: "안현동", name: "안현동" },
      { slug: "운산동", name: "운산동" },
      { slug: "주문진읍", name: "주문진읍" },
      { slug: "난곡동", name: "난곡동" },
      { slug: "옥계면", name: "옥계면" },
      { slug: "운정동", name: "운정동" },
      { slug: "성남동", name: "성남동" },
      { slug: "연곡면", name: "연곡면" },
      { slug: "구정면", name: "구정면" },
      { slug: "견소동", name: "견소동" },
      { slug: "내곡동", name: "내곡동" },
      { slug: "회산동", name: "회산동" },
      { slug: "장현동", name: "장현동" },
      { slug: "박월동", name: "박월동" },
      { slug: "담산동", name: "담산동" },
      { slug: "노암동", name: "노암동" },
      { slug: "유산동", name: "유산동" },
      { slug: "월호평동", name: "월호평동" },
      { slug: "신석동", name: "신석동" },
      { slug: "입암동", name: "입암동" },
      { slug: "청량동", name: "청량동" },
      { slug: "남항진동", name: "남항진동" },
      { slug: "유천동", name: "유천동" },
      { slug: "지변동", name: "지변동" },
      { slug: "죽헌동", name: "죽헌동" },
      { slug: "대전동", name: "대전동" },
      { slug: "두산동", name: "두산동" },
      { slug: "학동", name: "학동" },
      { slug: "병산동", name: "병산동" },
      { slug: "성산면", name: "성산면" },
      { slug: "성내동", name: "성내동" },
      { slug: "임당동", name: "임당동" },
      { slug: "금학동", name: "금학동" },
      { slug: "용강동", name: "용강동" },
      { slug: "강동면", name: "강동면" },
      { slug: "왕산면", name: "왕산면" },
      { slug: "홍제동", name: "홍제동" },
      { slug: "남문동", name: "남문동" },
      { slug: "명주동", name: "명주동" }
    ] },
    { slug: "화천군", name: "화천군", nameEn: "", dongs: [
      { slug: "화천군", name: "화천군" },
      { slug: "간동면", name: "간동면" },
      { slug: "하남면", name: "하남면" },
      { slug: "상서면", name: "상서면" },
      { slug: "사내면", name: "사내면" },
      { slug: "화천읍", name: "화천읍" }
    ] },
    { slug: "홍천군", name: "홍천군", nameEn: "", dongs: [
      { slug: "내촌면", name: "내촌면" },
      { slug: "두촌면", name: "두촌면" },
      { slug: "내면", name: "내면" },
      { slug: "남면", name: "남면" },
      { slug: "화촌면", name: "화촌면" },
      { slug: "영귀미면", name: "영귀미면" },
      { slug: "북방면", name: "북방면" },
      { slug: "서석면", name: "서석면" },
      { slug: "홍천군", name: "홍천군" },
      { slug: "홍천읍", name: "홍천읍" },
      { slug: "서면", name: "서면" }
    ] },
    { slug: "영월군", name: "영월군", nameEn: "", dongs: [
      { slug: "산솔면", name: "산솔면" },
      { slug: "상동읍", name: "상동읍" },
      { slug: "무릉도원면", name: "무릉도원면" },
      { slug: "북면", name: "북면" },
      { slug: "남면", name: "남면" },
      { slug: "한반도면", name: "한반도면" },
      { slug: "영월군", name: "영월군" },
      { slug: "영월읍", name: "영월읍" },
      { slug: "주천면", name: "주천면" },
      { slug: "김삿갓면", name: "김삿갓면" }
    ] },
    { slug: "양구군", name: "양구군", nameEn: "", dongs: [
      { slug: "방산면", name: "방산면" },
      { slug: "동면", name: "동면" },
      { slug: "양구군", name: "양구군" },
      { slug: "양구읍", name: "양구읍" },
      { slug: "해안면", name: "해안면" },
      { slug: "국토정중앙면", name: "국토정중앙면" }
    ] },
    { slug: "고성군", name: "고성군", nameEn: "", dongs: [
      { slug: "수동면", name: "수동면" },
      { slug: "고성군", name: "고성군" },
      { slug: "간성읍", name: "간성읍" },
      { slug: "거진읍", name: "거진읍" },
      { slug: "토성면", name: "토성면" },
      { slug: "현내면", name: "현내면" },
      { slug: "죽왕면", name: "죽왕면" }
    ] },
    { slug: "횡성군", name: "횡성군", nameEn: "", dongs: [
      { slug: "갑천면", name: "갑천면" },
      { slug: "횡성군", name: "횡성군" },
      { slug: "횡성읍", name: "횡성읍" },
      { slug: "서원면", name: "서원면" },
      { slug: "청일면", name: "청일면" },
      { slug: "강림면", name: "강림면" },
      { slug: "안흥면", name: "안흥면" },
      { slug: "공근면", name: "공근면" },
      { slug: "우천면", name: "우천면" },
      { slug: "둔내면", name: "둔내면" }
    ] },
    { slug: "평창군", name: "평창군", nameEn: "", dongs: [
      { slug: "용평면", name: "용평면" },
      { slug: "방림면", name: "방림면" },
      { slug: "미탄면", name: "미탄면" },
      { slug: "대화면", name: "대화면" },
      { slug: "평창군", name: "평창군" },
      { slug: "평창읍", name: "평창읍" },
      { slug: "봉평면", name: "봉평면" },
      { slug: "대관령면", name: "대관령면" },
      { slug: "진부면", name: "진부면" }
    ] },
    { slug: "동해시", name: "동해시", nameEn: "", dongs: [
      { slug: "발한동", name: "발한동" },
      { slug: "북평동", name: "북평동" },
      { slug: "구미동", name: "구미동" },
      { slug: "추암동", name: "추암동" },
      { slug: "망상동", name: "망상동" },
      { slug: "심곡동", name: "심곡동" },
      { slug: "초구동", name: "초구동" },
      { slug: "괴란동", name: "괴란동" },
      { slug: "내동", name: "내동" },
      { slug: "삼화동", name: "삼화동" },
      { slug: "이기동", name: "이기동" },
      { slug: "호현동", name: "호현동" },
      { slug: "구호동", name: "구호동" },
      { slug: "단봉동", name: "단봉동" },
      { slug: "지가동", name: "지가동" },
      { slug: "이도동", name: "이도동" },
      { slug: "귀운동", name: "귀운동" },
      { slug: "대구동", name: "대구동" },
      { slug: "동해시", name: "동해시" },
      { slug: "묵호진동", name: "묵호진동" },
      { slug: "어달동", name: "어달동" },
      { slug: "대진동", name: "대진동" },
      { slug: "이로동", name: "이로동" },
      { slug: "비천동", name: "비천동" },
      { slug: "만우동", name: "만우동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "천곡동", name: "천곡동" },
      { slug: "평릉동", name: "평릉동" },
      { slug: "송정동", name: "송정동" },
      { slug: "용정동", name: "용정동" },
      { slug: "지흥동", name: "지흥동" },
      { slug: "효가동", name: "효가동" },
      { slug: "동회동", name: "동회동" },
      { slug: "나안동", name: "나안동" },
      { slug: "쇄운동", name: "쇄운동" },
      { slug: "부곡동", name: "부곡동" },
      { slug: "달방동", name: "달방동" }
    ] },
    { slug: "정선군", name: "정선군", nameEn: "", dongs: [
      { slug: "임계면", name: "임계면" },
      { slug: "신동읍", name: "신동읍" },
      { slug: "화암면", name: "화암면" },
      { slug: "고한읍", name: "고한읍" },
      { slug: "정선읍", name: "정선읍" },
      { slug: "사북읍", name: "사북읍" },
      { slug: "남면", name: "남면" },
      { slug: "여량면", name: "여량면" },
      { slug: "정선군", name: "정선군" },
      { slug: "북평면", name: "북평면" }
    ] },
    { slug: "속초시", name: "속초시", nameEn: "", dongs: [
      { slug: "장사동", name: "장사동" },
      { slug: "대포동", name: "대포동" },
      { slug: "도문동", name: "도문동" },
      { slug: "설악동", name: "설악동" },
      { slug: "동명동", name: "동명동" },
      { slug: "노학동", name: "노학동" },
      { slug: "조양동", name: "조양동" },
      { slug: "청호동", name: "청호동" },
      { slug: "속초시", name: "속초시" },
      { slug: "영랑동", name: "영랑동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "금호동", name: "금호동" },
      { slug: "청학동", name: "청학동" },
      { slug: "교동", name: "교동" }
    ] }
  ],
    districtCount: 18,
    dongCount: 193,
    characteristics: {
      summary: "\uC124\uC545\xB7\uB3D9\uD574\xB7DMZ\uAC00 \uC788\uB294 \uCC9C\uD61C\uC758 \uAD00\uAD11\xB7\uB808\uC800 \uC790\uC6D0 \uD48D\uBD80\uD55C \uC9C0\uC5ED",
      storeTypes: ["\uAD00\uAD11\uC9C0 \uCE74\uD398\xB7\uC2DD\uB2F9", "\uD574\uC218\uC695\uC7A5 \uB9E4\uC7A5", "\uC2A4\uD0A4\uC7A5\xB7\uB9AC\uC870\uD2B8", "\uD39C\uC158\xB7\uBBFC\uBC15"],
      customerBase: ["\uC218\uB3C4\uAD8C \uAD00\uAD11\uAC1D", "\uC678\uAD6D\uC778 \uAD00\uAD11\uAC1D", "\uC9C0\uC5ED \uC8FC\uBBFC", "\uC740\uD1F4\uC790\xB7\uADC0\uCD0C\uC778"],
      businessHours: "\uAD00\uAD11 \uC131\uC218\uAE30(\uC5EC\uB984\xB7\uACA8\uC6B8) \uC2EC\uC57C \uC6B4\uC601, \uBE44\uC218\uAE30 \uB2E8\uCD95"
    },
    businessEnvironment: {
      majorIndustries: ["\uAD00\uAD11\xB7\uB808\uC800", "\uC218\uC0B0\uC5C5", "\uB18D\uC5C5\xB7\uC784\uC5C5", "\uC2A4\uD0A4\xB7\uB9AC\uC870\uD2B8"],
      commercialAreas: ["\uCD98\uCC9C \uBA85\uB3D9", "\uAC15\uB989 \uC548\uBAA9\uD574\uBCC0", "\uC18D\uCD08 \uC911\uC559\uC2DC\uC7A5", "\uD3C9\uCC3D \uC9C4\uBD80"],
      infrastructure: ["KTX \uAC15\uB989\uC120", "\uC601\uB3D9\uACE0\uC18D\uB3C4\uB85C", "\uD3C9\uCC3D\uC62C\uB9BC\uD53D \uC2DC\uC124", "\uB3D9\uD574 \uD56D\uB9CC"]
    },
    installationTips: [
      "\uAD00\uAD11 \uC131\uC218\uAE30/\uBE44\uC218\uAE30 \uB9E4\uCD9C \uCC28\uC774 \uB300\uC751 \uC2DC\uC2A4\uD15C",
      "\uC678\uAD6D\uC778 \uAD00\uAD11\uAC1D \uB300\uC0C1 \uB2E4\uAD6D\uC5B4 \uACB0\uC81C",
      "\uD574\uC548\uAC00 \uC5FC\uBD84 \uB300\uC751 \uBC29\uC218 \uC7A5\uBE44",
      "\uC0B0\uAC04 \uC9C0\uC5ED \uD1B5\uC2E0 \uC548\uC815\uC131 \uD655\uBCF4 \uD544\uC694"
    ],
    featuredDistricts: [
      { name: "\uCD98\uCC9C\uC2DC", description: "\uB2ED\uAC08\uBE44\xB7\uB9C9\uAD6D\uC218 \uB4F1 \uAD00\uAD11\xB7\uBA39\uAC70\uB9AC \uC911\uC2EC" },
      { name: "\uAC15\uB989\uC2DC", description: "\uCEE4\uD53C\uAC70\uB9AC\xB7\uC548\uBAA9\uD574\uBCC0, \uAC10\uC131 \uCE74\uD398 \uC9D1\uC911" },
      { name: "\uC18D\uCD08\uC2DC", description: "\uC124\uC545\uC0B0\xB7\uD574\uC218\uC695\uC7A5, \uAD00\uAD11\uAC1D \uB300\uC0C1 \uB9E4\uC7A5" },
      { name: "\uD3C9\uCC3D\uAD70", description: "\uC2A4\uD0A4\uC7A5\xB7\uB9AC\uC870\uD2B8, \uACA8\uC6B8 \uC131\uC218\uAE30 \uC9D1\uC911" }
    ]
  },
  // ========================================
  // 충청북도
  // ========================================
  {
    code: "chungbuk",
    nameKo: "\uCDA9\uCCAD\uBD81\uB3C4",
    nameKoShort: "\uCDA9\uBD81",
    nameEn: "Chungbuk",
    districts: [
    { slug: "청주시서원구", name: "청주시서원구", nameEn: "", dongs: [
      { slug: "장성동", name: "장성동" },
      { slug: "청주시서원구", name: "청주시서원구" },
      { slug: "사직동", name: "사직동" },
      { slug: "수곡동", name: "수곡동" },
      { slug: "장암동", name: "장암동" },
      { slug: "남이면", name: "남이면" },
      { slug: "사창동", name: "사창동" },
      { slug: "분평동", name: "분평동" },
      { slug: "모충동", name: "모충동" },
      { slug: "산남동", name: "산남동" },
      { slug: "미평동", name: "미평동" },
      { slug: "성화동", name: "성화동" },
      { slug: "개신동", name: "개신동" },
      { slug: "죽림동", name: "죽림동" },
      { slug: "현도면", name: "현도면" }
    ] },
    { slug: "청주시상당구", name: "청주시상당구", nameEn: "", dongs: [
      { slug: "석교동", name: "석교동" },
      { slug: "문의면", name: "문의면" },
      { slug: "기암리(基岩)", name: "기암리(基岩)" },
      { slug: "기암리(岐岩)", name: "기암리(岐岩)" },
      { slug: "남주동", name: "남주동" },
      { slug: "수동", name: "수동" },
      { slug: "미원면", name: "미원면" },
      { slug: "용암동", name: "용암동" },
      { slug: "가덕면", name: "가덕면" },
      { slug: "남일면", name: "남일면" },
      { slug: "서운동", name: "서운동" },
      { slug: "서문동", name: "서문동" },
      { slug: "청주시상당구", name: "청주시상당구" },
      { slug: "탑동", name: "탑동" },
      { slug: "명암동", name: "명암동" },
      { slug: "산성동", name: "산성동" },
      { slug: "영동", name: "영동" },
      { slug: "북문로1가", name: "북문로1가" },
      { slug: "북문로2가", name: "북문로2가" },
      { slug: "북문로3가", name: "북문로3가" },
      { slug: "남문로1가", name: "남문로1가" },
      { slug: "용정동", name: "용정동" },
      { slug: "방서동", name: "방서동" },
      { slug: "평촌동", name: "평촌동" },
      { slug: "지북동", name: "지북동" },
      { slug: "운동동", name: "운동동" },
      { slug: "월오동", name: "월오동" },
      { slug: "낭성면", name: "낭성면" },
      { slug: "대성동", name: "대성동" },
      { slug: "영운동", name: "영운동" },
      { slug: "금천동", name: "금천동" },
      { slug: "용담동", name: "용담동" },
      { slug: "남문로2가", name: "남문로2가" },
      { slug: "문화동", name: "문화동" }
    ] },
    { slug: "청주시흥덕구", name: "청주시흥덕구", nameEn: "", dongs: [
      { slug: "내곡동", name: "내곡동" },
      { slug: "상신동", name: "상신동" },
      { slug: "신봉동", name: "신봉동" },
      { slug: "가경동", name: "가경동" },
      { slug: "복대동", name: "복대동" },
      { slug: "정봉동", name: "정봉동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "원평동", name: "원평동" },
      { slug: "문암동", name: "문암동" },
      { slug: "외북동", name: "외북동" },
      { slug: "향정동", name: "향정동" },
      { slug: "비하동", name: "비하동" },
      { slug: "석소동", name: "석소동" },
      { slug: "신성동", name: "신성동" },
      { slug: "서촌동", name: "서촌동" },
      { slug: "화계동", name: "화계동" },
      { slug: "평동", name: "평동" },
      { slug: "신대동", name: "신대동" },
      { slug: "남촌동", name: "남촌동" },
      { slug: "청주시흥덕구", name: "청주시흥덕구" },
      { slug: "운천동", name: "운천동" },
      { slug: "강내면", name: "강내면" },
      { slug: "오송읍", name: "오송읍" },
      { slug: "송절동", name: "송절동" },
      { slug: "현암동", name: "현암동" },
      { slug: "동막동", name: "동막동" },
      { slug: "옥산면", name: "옥산면" },
      { slug: "수의동", name: "수의동" },
      { slug: "지동동", name: "지동동" },
      { slug: "휴암동", name: "휴암동" },
      { slug: "신전동", name: "신전동" },
      { slug: "봉명동", name: "봉명동" },
      { slug: "송정동", name: "송정동" },
      { slug: "강서동", name: "강서동" },
      { slug: "석곡동", name: "석곡동" }
    ] },
    { slug: "보은군", name: "보은군", nameEn: "", dongs: [
      { slug: "마로면", name: "마로면" },
      { slug: "탄부면", name: "탄부면" },
      { slug: "회인면", name: "회인면" },
      { slug: "회남면", name: "회남면" },
      { slug: "보은군", name: "보은군" },
      { slug: "보은읍", name: "보은읍" },
      { slug: "산외면", name: "산외면" },
      { slug: "내북면", name: "내북면" },
      { slug: "삼승면", name: "삼승면" },
      { slug: "장안면", name: "장안면" },
      { slug: "속리산면", name: "속리산면" },
      { slug: "수한면", name: "수한면" }
    ] },
    { slug: "충주시", name: "충주시", nameEn: "", dongs: [
      { slug: "앙성면", name: "앙성면" },
      { slug: "중앙탑면", name: "중앙탑면" },
      { slug: "용탄동", name: "용탄동" },
      { slug: "종민동", name: "종민동" },
      { slug: "안림동", name: "안림동" },
      { slug: "목벌동", name: "목벌동" },
      { slug: "용두동", name: "용두동" },
      { slug: "달천동", name: "달천동" },
      { slug: "노은면", name: "노은면" },
      { slug: "수안보면", name: "수안보면" },
      { slug: "금가면", name: "금가면" },
      { slug: "풍동", name: "풍동" },
      { slug: "가주동", name: "가주동" },
      { slug: "살미면", name: "살미면" },
      { slug: "교현동", name: "교현동" },
      { slug: "신니면", name: "신니면" },
      { slug: "대소원면", name: "대소원면" },
      { slug: "소태면", name: "소태면" },
      { slug: "문화동", name: "문화동" },
      { slug: "충의동", name: "충의동" },
      { slug: "용관동", name: "용관동" },
      { slug: "산척면", name: "산척면" },
      { slug: "충주시", name: "충주시" },
      { slug: "성내동", name: "성내동" },
      { slug: "성남동", name: "성남동" },
      { slug: "지현동", name: "지현동" },
      { slug: "엄정면", name: "엄정면" },
      { slug: "금릉동", name: "금릉동" },
      { slug: "주덕읍", name: "주덕읍" },
      { slug: "봉방동", name: "봉방동" },
      { slug: "칠금동", name: "칠금동" },
      { slug: "연수동", name: "연수동" },
      { slug: "목행동", name: "목행동" },
      { slug: "용산동", name: "용산동" },
      { slug: "호암동", name: "호암동" },
      { slug: "직동", name: "직동" },
      { slug: "단월동", name: "단월동" },
      { slug: "동량면", name: "동량면" },
      { slug: "성서동", name: "성서동" },
      { slug: "충인동", name: "충인동" },
      { slug: "가금면", name: "가금면" }
    ] },
    { slug: "진천군", name: "진천군", nameEn: "", dongs: [
      { slug: "이월면", name: "이월면" },
      { slug: "백곡면", name: "백곡면" },
      { slug: "초평면", name: "초평면" },
      { slug: "문백면", name: "문백면" },
      { slug: "덕산읍", name: "덕산읍" },
      { slug: "진천군", name: "진천군" },
      { slug: "진천읍", name: "진천읍" },
      { slug: "광혜원면", name: "광혜원면" },
      { slug: "덕산면", name: "덕산면" }
    ] },
    { slug: "옥천군", name: "옥천군", nameEn: "", dongs: [
      { slug: "옥천읍", name: "옥천읍" },
      { slug: "옥천군", name: "옥천군" },
      { slug: "이원면", name: "이원면" },
      { slug: "동이면", name: "동이면" },
      { slug: "안내면", name: "안내면" },
      { slug: "청성면", name: "청성면" },
      { slug: "군서면", name: "군서면" },
      { slug: "안남면", name: "안남면" },
      { slug: "군북면", name: "군북면" },
      { slug: "청산면", name: "청산면" }
    ] },
    { slug: "제천시", name: "제천시", nameEn: "", dongs: [
      { slug: "금성면", name: "금성면" },
      { slug: "송학면", name: "송학면" },
      { slug: "청풍면", name: "청풍면" },
      { slug: "천남동", name: "천남동" },
      { slug: "신동", name: "신동" },
      { slug: "고명동", name: "고명동" },
      { slug: "신백동", name: "신백동" },
      { slug: "강제동", name: "강제동" },
      { slug: "명지동", name: "명지동" },
      { slug: "산곡동", name: "산곡동" },
      { slug: "왕암동", name: "왕암동" },
      { slug: "백운면", name: "백운면" },
      { slug: "남천동", name: "남천동" },
      { slug: "교동", name: "교동" },
      { slug: "중앙로1가", name: "중앙로1가" },
      { slug: "제천시", name: "제천시" },
      { slug: "자작동", name: "자작동" },
      { slug: "대랑동", name: "대랑동" },
      { slug: "봉양읍", name: "봉양읍" },
      { slug: "영천동", name: "영천동" },
      { slug: "하소동", name: "하소동" },
      { slug: "신월동", name: "신월동" },
      { slug: "중앙로2가", name: "중앙로2가" },
      { slug: "명동", name: "명동" },
      { slug: "화산동", name: "화산동" },
      { slug: "청전동", name: "청전동" },
      { slug: "모산동", name: "모산동" },
      { slug: "고암동", name: "고암동" },
      { slug: "장락동", name: "장락동" },
      { slug: "흑석동", name: "흑석동" },
      { slug: "두학동", name: "두학동" },
      { slug: "의림동", name: "의림동" },
      { slug: "서부동", name: "서부동" },
      { slug: "덕산면", name: "덕산면" },
      { slug: "동현동", name: "동현동" },
      { slug: "수산면", name: "수산면" },
      { slug: "한수면", name: "한수면" }
    ] },
    { slug: "음성군", name: "음성군", nameEn: "", dongs: [
      { slug: "음성군", name: "음성군" },
      { slug: "음성읍", name: "음성읍" },
      { slug: "소이면", name: "소이면" },
      { slug: "생극면", name: "생극면" },
      { slug: "감곡면", name: "감곡면" },
      { slug: "금왕읍", name: "금왕읍" },
      { slug: "원남면", name: "원남면" },
      { slug: "맹동면", name: "맹동면" },
      { slug: "대소면", name: "대소면" },
      { slug: "삼성면", name: "삼성면" }
    ] },
    { slug: "청주시청원구", name: "청주시청원구", nameEn: "", dongs: [
      { slug: "외남동", name: "외남동" },
      { slug: "외평동", name: "외평동" },
      { slug: "외하동", name: "외하동" },
      { slug: "주중동", name: "주중동" },
      { slug: "정상동", name: "정상동" },
      { slug: "정하동", name: "정하동" },
      { slug: "정북동", name: "정북동" },
      { slug: "오동동", name: "오동동" },
      { slug: "북이면", name: "북이면" },
      { slug: "내덕동", name: "내덕동" },
      { slug: "율량동", name: "율량동" },
      { slug: "오창읍", name: "오창읍" },
      { slug: "화산리(華山)", name: "화산리(華山)" },
      { slug: "내수읍", name: "내수읍" },
      { slug: "청주시청원구", name: "청주시청원구" },
      { slug: "우암동", name: "우암동" },
      { slug: "화산리(花山)", name: "화산리(花山)" },
      { slug: "사천동", name: "사천동" },
      { slug: "주성동", name: "주성동" }
    ] },
    { slug: "단양군", name: "단양군", nameEn: "", dongs: [
      { slug: "대강면", name: "대강면" },
      { slug: "적성면", name: "적성면" },
      { slug: "단양군", name: "단양군" },
      { slug: "단양읍", name: "단양읍" },
      { slug: "매포읍", name: "매포읍" },
      { slug: "어상천면", name: "어상천면" },
      { slug: "가곡면", name: "가곡면" },
      { slug: "영춘면", name: "영춘면" },
      { slug: "단성면", name: "단성면" }
    ] },
    { slug: "영동군", name: "영동군", nameEn: "", dongs: [
      { slug: "양강면", name: "양강면" },
      { slug: "양산면", name: "양산면" },
      { slug: "학산면", name: "학산면" },
      { slug: "영동군", name: "영동군" },
      { slug: "영동읍", name: "영동읍" },
      { slug: "황간면", name: "황간면" },
      { slug: "용산면", name: "용산면" },
      { slug: "매곡면", name: "매곡면" },
      { slug: "심천면", name: "심천면" },
      { slug: "상촌면", name: "상촌면" },
      { slug: "추풍령면", name: "추풍령면" },
      { slug: "용화면", name: "용화면" }
    ] },
    { slug: "괴산군", name: "괴산군", nameEn: "", dongs: [
      { slug: "불정면", name: "불정면" },
      { slug: "청천면", name: "청천면" },
      { slug: "소수면", name: "소수면" },
      { slug: "사리면", name: "사리면" },
      { slug: "칠성면", name: "칠성면" },
      { slug: "문광면", name: "문광면" },
      { slug: "청안면", name: "청안면" },
      { slug: "괴산군", name: "괴산군" },
      { slug: "연풍면", name: "연풍면" },
      { slug: "장연면", name: "장연면" },
      { slug: "괴산읍", name: "괴산읍" },
      { slug: "감물면", name: "감물면" }
    ] },
    { slug: "증평군", name: "증평군", nameEn: "", dongs: [
      { slug: "도안면", name: "도안면" },
      { slug: "증평군", name: "증평군" },
      { slug: "증평읍", name: "증평읍" }
    ] },
    { slug: "청주시", name: "청주시", nameEn: "", dongs: [
      { slug: "청주시", name: "청주시" }
    ] },
    { slug: "청주시 청원구", name: "청주시 청원구", nameEn: "", dongs: [
      { slug: "우암동", name: "우암동" },
      { slug: "내덕동", name: "내덕동" },
      { slug: "율량동", name: "율량동" },
      { slug: "사천동", name: "사천동" },
      { slug: "주성동", name: "주성동" },
      { slug: "주중동", name: "주중동" },
      { slug: "정상동", name: "정상동" },
      { slug: "정하동", name: "정하동" },
      { slug: "정북동", name: "정북동" },
      { slug: "오동동", name: "오동동" },
      { slug: "외남동", name: "외남동" },
      { slug: "외평동", name: "외평동" },
      { slug: "외하동", name: "외하동" },
      { slug: "화산리(花山)", name: "화산리(花山)" },
      { slug: "북이면", name: "북이면" },
      { slug: "청주시 청원구", name: "청주시 청원구" },
      { slug: "내수읍", name: "내수읍" },
      { slug: "오창읍", name: "오창읍" },
      { slug: "화산리(華山)", name: "화산리(華山)" }
    ] },
    { slug: "청주시 흥덕구", name: "청주시 흥덕구", nameEn: "", dongs: [
      { slug: "운천동", name: "운천동" },
      { slug: "신봉동", name: "신봉동" },
      { slug: "복대동", name: "복대동" },
      { slug: "가경동", name: "가경동" },
      { slug: "봉명동", name: "봉명동" },
      { slug: "송정동", name: "송정동" },
      { slug: "강서동", name: "강서동" },
      { slug: "석곡동", name: "석곡동" },
      { slug: "휴암동", name: "휴암동" },
      { slug: "신전동", name: "신전동" },
      { slug: "현암동", name: "현암동" },
      { slug: "동막동", name: "동막동" },
      { slug: "수의동", name: "수의동" },
      { slug: "지동동", name: "지동동" },
      { slug: "서촌동", name: "서촌동" },
      { slug: "비하동", name: "비하동" },
      { slug: "석소동", name: "석소동" },
      { slug: "정봉동", name: "정봉동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "신성동", name: "신성동" },
      { slug: "평동", name: "평동" },
      { slug: "신대동", name: "신대동" },
      { slug: "남촌동", name: "남촌동" },
      { slug: "내곡동", name: "내곡동" },
      { slug: "상신동", name: "상신동" },
      { slug: "원평동", name: "원평동" },
      { slug: "문암동", name: "문암동" },
      { slug: "송절동", name: "송절동" },
      { slug: "화계동", name: "화계동" },
      { slug: "외북동", name: "외북동" },
      { slug: "향정동", name: "향정동" },
      { slug: "청주시흥덕구", name: "청주시흥덕구" },
      { slug: "오송읍", name: "오송읍" },
      { slug: "강내면", name: "강내면" },
      { slug: "옥산면", name: "옥산면" },
      { slug: "사직동", name: "사직동" },
      { slug: "사창동", name: "사창동" },
      { slug: "모충동", name: "모충동" },
      { slug: "산남동", name: "산남동" },
      { slug: "미평동", name: "미평동" },
      { slug: "분평동", name: "분평동" },
      { slug: "장성동", name: "장성동" },
      { slug: "장암동", name: "장암동" },
      { slug: "수곡동", name: "수곡동" },
      { slug: "성화동", name: "성화동" },
      { slug: "개신동", name: "개신동" },
      { slug: "죽림동", name: "죽림동" }
    ] },
    { slug: "청주시 서원구", name: "청주시 서원구", nameEn: "", dongs: [
      { slug: "분평동", name: "분평동" },
      { slug: "장성동", name: "장성동" },
      { slug: "장암동", name: "장암동" },
      { slug: "수곡동", name: "수곡동" },
      { slug: "성화동", name: "성화동" },
      { slug: "개신동", name: "개신동" },
      { slug: "죽림동", name: "죽림동" },
      { slug: "사직동", name: "사직동" },
      { slug: "사창동", name: "사창동" },
      { slug: "모충동", name: "모충동" },
      { slug: "산남동", name: "산남동" },
      { slug: "미평동", name: "미평동" },
      { slug: "청주시 서원구", name: "청주시 서원구" },
      { slug: "남이면", name: "남이면" },
      { slug: "현도면", name: "현도면" }
    ] },
    { slug: "청주시 상당구", name: "청주시 상당구", nameEn: "", dongs: [
      { slug: "영동", name: "영동" },
      { slug: "북문로2가", name: "북문로2가" },
      { slug: "북문로3가", name: "북문로3가" },
      { slug: "수동", name: "수동" },
      { slug: "북문로1가", name: "북문로1가" },
      { slug: "남문로1가", name: "남문로1가" },
      { slug: "남문로2가", name: "남문로2가" },
      { slug: "문화동", name: "문화동" },
      { slug: "서운동", name: "서운동" },
      { slug: "서문동", name: "서문동" },
      { slug: "남주동", name: "남주동" },
      { slug: "방서동", name: "방서동" },
      { slug: "평촌동", name: "평촌동" },
      { slug: "지북동", name: "지북동" },
      { slug: "운동동", name: "운동동" },
      { slug: "월오동", name: "월오동" },
      { slug: "석교동", name: "석교동" },
      { slug: "탑동", name: "탑동" },
      { slug: "대성동", name: "대성동" },
      { slug: "영운동", name: "영운동" },
      { slug: "금천동", name: "금천동" },
      { slug: "용담동", name: "용담동" },
      { slug: "명암동", name: "명암동" },
      { slug: "산성동", name: "산성동" },
      { slug: "용암동", name: "용암동" },
      { slug: "용정동", name: "용정동" },
      { slug: "남일면", name: "남일면" },
      { slug: "문의면", name: "문의면" },
      { slug: "미원면", name: "미원면" },
      { slug: "기암리(岐岩)", name: "기암리(岐岩)" },
      { slug: "기암리(基岩)", name: "기암리(基岩)" },
      { slug: "가덕면", name: "가덕면" },
      { slug: "낭성면", name: "낭성면" },
      { slug: "청주시상당구", name: "청주시상당구" },
      { slug: "주성동", name: "주성동" },
      { slug: "주중동", name: "주중동" },
      { slug: "정상동", name: "정상동" },
      { slug: "정하동", name: "정하동" },
      { slug: "정북동", name: "정북동" },
      { slug: "오동동", name: "오동동" },
      { slug: "외남동", name: "외남동" },
      { slug: "외평동", name: "외평동" },
      { slug: "외하동", name: "외하동" },
      { slug: "우암동", name: "우암동" },
      { slug: "내덕동", name: "내덕동" },
      { slug: "율량동", name: "율량동" },
      { slug: "사천동", name: "사천동" }
    ] },
    { slug: "청원군", name: "청원군", nameEn: "", dongs: [
      { slug: "북이면", name: "북이면" },
      { slug: "현도면", name: "현도면" },
      { slug: "강내면", name: "강내면" },
      { slug: "옥산면", name: "옥산면" },
      { slug: "문의면", name: "문의면" },
      { slug: "기암리(基岩)", name: "기암리(基岩)" },
      { slug: "가덕면", name: "가덕면" },
      { slug: "남일면", name: "남일면" },
      { slug: "남이면", name: "남이면" },
      { slug: "낭성면", name: "낭성면" },
      { slug: "미원면", name: "미원면" },
      { slug: "기암리(岐岩)", name: "기암리(岐岩)" },
      { slug: "오창읍", name: "오창읍" },
      { slug: "화산리(華山)", name: "화산리(華山)" },
      { slug: "화산리(花山)", name: "화산리(花山)" },
      { slug: "오송읍", name: "오송읍" },
      { slug: "청원군", name: "청원군" },
      { slug: "내수읍", name: "내수읍" }
    ] }
  ],
    districtCount: 11,
    dongCount: 153,
    characteristics: {
      summary: "\uC911\uBD80\uAD8C \uAD50\uD1B5 \uC694\uCDA9\uC9C0, \uACFC\uD559\xB7\uCCA8\uB2E8 \uC0B0\uC5C5\uACFC \uC804\uD1B5 \uB18D\uC5C5 \uACF5\uC874",
      storeTypes: ["\uB300\uD559\uAC00 \uC2DD\uB2F9", "\uACF5\uB2E8 \uC778\uADFC \uB9E4\uC7A5", "\uB18D\uCD0C \uC0DD\uD65C \uC0C1\uAD8C", "\uAD00\uAD11 \uBA85\uC18C \uCE74\uD398"],
      customerBase: ["\uB300\uD559\uC0DD", "\uACF5\uB2E8 \uADFC\uB85C\uC790", "\uB18D\uC5C5\uC778", "\uCDA9\uBD81 \uB3C4\uBBFC"],
      businessHours: "\uD3C9\uC77C \uC810\uC2EC\xB7\uC800\uB141 \uC9D1\uC911, \uC8FC\uB9D0 \uAC00\uC871 \uC678\uC2DD \uC218\uC694"
    },
    businessEnvironment: {
      majorIndustries: ["\uC804\uAE30\xB7\uC804\uC790", "\uBC14\uC774\uC624\xB7\uC81C\uC57D", "\uB18D\uC5C5", "\uAD00\uAD11"],
      commercialAreas: ["\uCCAD\uC8FC \uC131\uC548\uAE38", "\uCDA9\uC8FC \uD638\uC554\uB3D9", "\uC81C\uCC9C \uC911\uC559\uB85C"],
      infrastructure: ["\uCCAD\uC8FC\uAD6D\uC81C\uACF5\uD56D", "KTX \uC624\uC1A1\uC5ED", "\uC624\uC1A1 \uBC14\uC774\uC624\uB2E8\uC9C0", "\uC911\uBD80\uACE0\uC18D\uB3C4\uB85C"]
    },
    installationTips: [
      "\uBC14\uC774\uC624\xB7\uC81C\uC57D \uACF5\uB2E8 \uC5F0\uACC4 B2B \uC194\uB8E8\uC158",
      "\uB300\uD559\uAC00 \uB9E4\uC7A5\uC758 \uD559\uC0DD \uD560\uC778 \uC2DC\uC2A4\uD15C",
      "\uB18D\uC5C5\uC778 \uB300\uC0C1 \uAC04\uD3B8 \uACB0\uC81C \uC9C0\uC6D0",
      "\uAD50\uD1B5 \uC694\uCDA9\uC9C0 \uD2B9\uC131 \uD65C\uC6A9\uD55C \uD734\uAC8C\uC18C\xB7\uCE74\uD398"
    ],
    featuredDistricts: [
      { name: "\uCCAD\uC8FC\uC2DC", description: "\uCDA9\uBD81 \uC911\uC2EC\uC9C0, \uD589\uC815\xB7\uAD50\uC721\xB7\uC0C1\uC5C5 \uBCF5\uD569 \uC0C1\uAD8C" },
      { name: "\uCDA9\uC8FC\uC2DC", description: "\uD638\uC554\xB7\uC5F0\uC218\uB3D9 \uC0C1\uAD8C, \uD638\uC218\uAD8C \uAD00\uAD11 \uB9E4\uC7A5" },
      { name: "\uC81C\uCC9C\uC2DC", description: "\uC57D\uCD08\xB7\uC758\uB8CC \uD2B9\uD654, \uC57D\uB839\uC2DC\uC7A5 \uC5F0\uACC4 \uC0C1\uAD8C" }
    ]
  },
  // ========================================
  // 충청남도
  // ========================================
  {
    code: "chungnam",
    nameKo: "\uCDA9\uCCAD\uB0A8\uB3C4",
    nameKoShort: "\uCDA9\uB0A8",
    nameEn: "Chungnam",
    districts: [
    { slug: "서천군", name: "서천군", nameEn: "", dongs: [
      { slug: "비인면", name: "비인면" },
      { slug: "시초면", name: "시초면" },
      { slug: "한산면", name: "한산면" },
      { slug: "서면", name: "서면" },
      { slug: "문산면", name: "문산면" },
      { slug: "화양면", name: "화양면" },
      { slug: "서천군", name: "서천군" },
      { slug: "판교면", name: "판교면" },
      { slug: "장항읍", name: "장항읍" },
      { slug: "서천읍", name: "서천읍" },
      { slug: "종천면", name: "종천면" },
      { slug: "마서면", name: "마서면" },
      { slug: "마산면", name: "마산면" },
      { slug: "기산면", name: "기산면" }
    ] },
    { slug: "홍성군", name: "홍성군", nameEn: "", dongs: [
      { slug: "홍북읍", name: "홍북읍" },
      { slug: "결성면", name: "결성면" },
      { slug: "장곡면", name: "장곡면" },
      { slug: "홍동면", name: "홍동면" },
      { slug: "은하면", name: "은하면" },
      { slug: "금마면", name: "금마면" },
      { slug: "구항면", name: "구항면" },
      { slug: "갈산면", name: "갈산면" },
      { slug: "광천읍", name: "광천읍" },
      { slug: "서부면", name: "서부면" },
      { slug: "홍성군", name: "홍성군" },
      { slug: "홍성읍", name: "홍성읍" },
      { slug: "홍북면", name: "홍북면" }
    ] },
    { slug: "천안시서북구", name: "천안시서북구", nameEn: "", dongs: [
      { slug: "천안시서북구", name: "천안시서북구" },
      { slug: "와촌동", name: "와촌동" },
      { slug: "부대동", name: "부대동" },
      { slug: "성환읍", name: "성환읍" },
      { slug: "쌍용동", name: "쌍용동" },
      { slug: "불당동", name: "불당동" },
      { slug: "업성동", name: "업성동" },
      { slug: "신당동", name: "신당동" },
      { slug: "백석동", name: "백석동" },
      { slug: "두정동", name: "두정동" },
      { slug: "성정동", name: "성정동" },
      { slug: "성성동", name: "성성동" },
      { slug: "차암동", name: "차암동" },
      { slug: "직산읍", name: "직산읍" },
      { slug: "성거읍", name: "성거읍" },
      { slug: "입장면", name: "입장면" }
    ] },
    { slug: "아산시", name: "아산시", nameEn: "", dongs: [
      { slug: "음봉면", name: "음봉면" },
      { slug: "신동", name: "신동" },
      { slug: "배미동", name: "배미동" },
      { slug: "신창면", name: "신창면" },
      { slug: "영인면", name: "영인면" },
      { slug: "득산동", name: "득산동" },
      { slug: "점양동", name: "점양동" },
      { slug: "방축동", name: "방축동" },
      { slug: "기산동", name: "기산동" },
      { slug: "초사동", name: "초사동" },
      { slug: "신인동", name: "신인동" },
      { slug: "법곡동", name: "법곡동" },
      { slug: "장존동", name: "장존동" },
      { slug: "실옥동", name: "실옥동" },
      { slug: "배방읍", name: "배방읍" },
      { slug: "인주면", name: "인주면" },
      { slug: "읍내동", name: "읍내동" },
      { slug: "송악면", name: "송악면" },
      { slug: "온천동", name: "온천동" },
      { slug: "둔포면", name: "둔포면" },
      { slug: "도고면", name: "도고면" },
      { slug: "모종동", name: "모종동" },
      { slug: "권곡동", name: "권곡동" },
      { slug: "탕정면", name: "탕정면" },
      { slug: "아산시", name: "아산시" },
      { slug: "풍기동", name: "풍기동" },
      { slug: "용화동", name: "용화동" },
      { slug: "선장면", name: "선장면" },
      { slug: "남동", name: "남동" },
      { slug: "염치읍", name: "염치읍" },
      { slug: "좌부동", name: "좌부동" }
    ] },
    { slug: "공주시", name: "공주시", nameEn: "", dongs: [
      { slug: "정안면", name: "정안면" },
      { slug: "신관동", name: "신관동" },
      { slug: "금흥동", name: "금흥동" },
      { slug: "사곡면", name: "사곡면" },
      { slug: "송선동", name: "송선동" },
      { slug: "동현동", name: "동현동" },
      { slug: "유구읍", name: "유구읍" },
      { slug: "탄천면", name: "탄천면" },
      { slug: "신풍면", name: "신풍면" },
      { slug: "신기동", name: "신기동" },
      { slug: "소학동", name: "소학동" },
      { slug: "상왕동", name: "상왕동" },
      { slug: "무릉동", name: "무릉동" },
      { slug: "월송동", name: "월송동" },
      { slug: "태봉동", name: "태봉동" },
      { slug: "오곡동", name: "오곡동" },
      { slug: "봉정동", name: "봉정동" },
      { slug: "주미동", name: "주미동" },
      { slug: "우성면", name: "우성면" },
      { slug: "공주시", name: "공주시" },
      { slug: "반죽동", name: "반죽동" },
      { slug: "봉황동", name: "봉황동" },
      { slug: "중학동", name: "중학동" },
      { slug: "중동", name: "중동" },
      { slug: "산성동", name: "산성동" },
      { slug: "교동", name: "교동" },
      { slug: "웅진동", name: "웅진동" },
      { slug: "금성동", name: "금성동" },
      { slug: "옥룡동", name: "옥룡동" },
      { slug: "금학동", name: "금학동" },
      { slug: "이인면", name: "이인면" },
      { slug: "쌍신동", name: "쌍신동" },
      { slug: "월미동", name: "월미동" },
      { slug: "검상동", name: "검상동" },
      { slug: "석장리동", name: "석장리동" },
      { slug: "계룡면", name: "계룡면" },
      { slug: "반포면", name: "반포면" },
      { slug: "의당면", name: "의당면" }
    ] },
    { slug: "부여군", name: "부여군", nameEn: "", dongs: [
      { slug: "외산면", name: "외산면" },
      { slug: "규암면", name: "규암면" },
      { slug: "초촌면", name: "초촌면" },
      { slug: "남면", name: "남면" },
      { slug: "옥산면", name: "옥산면" },
      { slug: "세도면", name: "세도면" },
      { slug: "구룡면", name: "구룡면" },
      { slug: "석성면", name: "석성면" },
      { slug: "임천면", name: "임천면" },
      { slug: "충화면", name: "충화면" },
      { slug: "홍산면", name: "홍산면" },
      { slug: "내산면", name: "내산면" },
      { slug: "양화면", name: "양화면" },
      { slug: "은산면", name: "은산면" },
      { slug: "장암면", name: "장암면" },
      { slug: "부여군", name: "부여군" },
      { slug: "부여읍", name: "부여읍" }
    ] },
    { slug: "태안군", name: "태안군", nameEn: "", dongs: [
      { slug: "이원면", name: "이원면" },
      { slug: "태안군", name: "태안군" },
      { slug: "태안읍", name: "태안읍" },
      { slug: "고남면", name: "고남면" },
      { slug: "남면", name: "남면" },
      { slug: "근흥면", name: "근흥면" },
      { slug: "소원면", name: "소원면" },
      { slug: "원북면", name: "원북면" },
      { slug: "안면읍", name: "안면읍" }
    ] },
    { slug: "계룡시", name: "계룡시", nameEn: "", dongs: [
      { slug: "금암동", name: "금암동" },
      { slug: "두마면", name: "두마면" },
      { slug: "엄사면", name: "엄사면" },
      { slug: "신도안면", name: "신도안면" },
      { slug: "계룡시", name: "계룡시" }
    ] },
    { slug: "서산시", name: "서산시", nameEn: "", dongs: [
      { slug: "서산시", name: "서산시" },
      { slug: "읍내동", name: "읍내동" },
      { slug: "오남동", name: "오남동" },
      { slug: "장동", name: "장동" },
      { slug: "부석면", name: "부석면" },
      { slug: "지곡면", name: "지곡면" },
      { slug: "인지면", name: "인지면" },
      { slug: "석남동", name: "석남동" },
      { slug: "예천동", name: "예천동" },
      { slug: "죽성동", name: "죽성동" },
      { slug: "해미면", name: "해미면" },
      { slug: "덕지천동", name: "덕지천동" },
      { slug: "양대동", name: "양대동" },
      { slug: "운산면", name: "운산면" },
      { slug: "팔봉면", name: "팔봉면" },
      { slug: "대산읍", name: "대산읍" },
      { slug: "갈산동", name: "갈산동" },
      { slug: "온석동", name: "온석동" },
      { slug: "잠홍동", name: "잠홍동" },
      { slug: "수석동", name: "수석동" },
      { slug: "석림동", name: "석림동" },
      { slug: "음암면", name: "음암면" },
      { slug: "고북면", name: "고북면" },
      { slug: "성연면", name: "성연면" },
      { slug: "동문동", name: "동문동" }
    ] },
    { slug: "논산시", name: "논산시", nameEn: "", dongs: [
      { slug: "강경읍", name: "강경읍" },
      { slug: "연산면", name: "연산면" },
      { slug: "상월면", name: "상월면" },
      { slug: "가야곡면", name: "가야곡면" },
      { slug: "부적면", name: "부적면" },
      { slug: "노성면", name: "노성면" },
      { slug: "광석면", name: "광석면" },
      { slug: "은진면", name: "은진면" },
      { slug: "채운면", name: "채운면" },
      { slug: "논산시", name: "논산시" },
      { slug: "화지동", name: "화지동" },
      { slug: "벌곡면", name: "벌곡면" },
      { slug: "강산동", name: "강산동" },
      { slug: "관촉동", name: "관촉동" },
      { slug: "양촌면", name: "양촌면" },
      { slug: "반월동", name: "반월동" },
      { slug: "대교동", name: "대교동" },
      { slug: "부창동", name: "부창동" },
      { slug: "취암동", name: "취암동" },
      { slug: "등화동", name: "등화동" },
      { slug: "지산동", name: "지산동" },
      { slug: "덕지동", name: "덕지동" },
      { slug: "내동", name: "내동" },
      { slug: "성동면", name: "성동면" },
      { slug: "연무읍", name: "연무읍" }
    ] },
    { slug: "금산군", name: "금산군", nameEn: "", dongs: [
      { slug: "추부면", name: "추부면" },
      { slug: "남일면", name: "남일면" },
      { slug: "군북면", name: "군북면" },
      { slug: "복수면", name: "복수면" },
      { slug: "제원면", name: "제원면" },
      { slug: "부리면", name: "부리면" },
      { slug: "금산군", name: "금산군" },
      { slug: "금산읍", name: "금산읍" },
      { slug: "금성면", name: "금성면" },
      { slug: "남이면", name: "남이면" },
      { slug: "진산면", name: "진산면" }
    ] },
    { slug: "보령시", name: "보령시", nameEn: "", dongs: [
      { slug: "주산면", name: "주산면" },
      { slug: "주포면", name: "주포면" },
      { slug: "성주면", name: "성주면" },
      { slug: "주교면", name: "주교면" },
      { slug: "보령시", name: "보령시" },
      { slug: "미산면", name: "미산면" },
      { slug: "대천동", name: "대천동" },
      { slug: "죽정동", name: "죽정동" },
      { slug: "화산동", name: "화산동" },
      { slug: "명천동", name: "명천동" },
      { slug: "궁촌동", name: "궁촌동" },
      { slug: "내항동", name: "내항동" },
      { slug: "남곡동", name: "남곡동" },
      { slug: "요암동", name: "요암동" },
      { slug: "신흑동", name: "신흑동" },
      { slug: "웅천읍", name: "웅천읍" },
      { slug: "남포면", name: "남포면" },
      { slug: "오천면", name: "오천면" },
      { slug: "청라면", name: "청라면" },
      { slug: "동대동", name: "동대동" },
      { slug: "청소면", name: "청소면" },
      { slug: "천북면", name: "천북면" }
    ] },
    { slug: "당진시", name: "당진시", nameEn: "", dongs: [
      { slug: "우강면", name: "우강면" },
      { slug: "읍내동", name: "읍내동" },
      { slug: "채운동", name: "채운동" },
      { slug: "송악읍", name: "송악읍" },
      { slug: "송산면", name: "송산면" },
      { slug: "고대면", name: "고대면" },
      { slug: "당진시", name: "당진시" },
      { slug: "석문면", name: "석문면" },
      { slug: "대호지면", name: "대호지면" },
      { slug: "면천면", name: "면천면" },
      { slug: "순성면", name: "순성면" },
      { slug: "정미면", name: "정미면" },
      { slug: "합덕읍", name: "합덕읍" },
      { slug: "우두동", name: "우두동" },
      { slug: "신평면", name: "신평면" },
      { slug: "원당동", name: "원당동" },
      { slug: "시곡동", name: "시곡동" },
      { slug: "수청동", name: "수청동" },
      { slug: "대덕동", name: "대덕동" },
      { slug: "행정동", name: "행정동" },
      { slug: "용연동", name: "용연동" },
      { slug: "사기소동", name: "사기소동" },
      { slug: "구룡동", name: "구룡동" }
    ] },
    { slug: "천안시동남구", name: "천안시동남구", nameEn: "", dongs: [
      { slug: "용곡동", name: "용곡동" },
      { slug: "병천면", name: "병천면" },
      { slug: "구성동", name: "구성동" },
      { slug: "청수동", name: "청수동" },
      { slug: "삼룡동", name: "삼룡동" },
      { slug: "청당동", name: "청당동" },
      { slug: "신방동", name: "신방동" },
      { slug: "쌍용동", name: "쌍용동" },
      { slug: "대흥동", name: "대흥동" },
      { slug: "성황동", name: "성황동" },
      { slug: "목천읍", name: "목천읍" },
      { slug: "신부동", name: "신부동" },
      { slug: "안서동", name: "안서동" },
      { slug: "구룡동", name: "구룡동" },
      { slug: "유량동", name: "유량동" },
      { slug: "봉명동", name: "봉명동" },
      { slug: "다가동", name: "다가동" },
      { slug: "동면", name: "동면" },
      { slug: "문화동", name: "문화동" },
      { slug: "사직동", name: "사직동" },
      { slug: "영성동", name: "영성동" },
      { slug: "광덕면", name: "광덕면" },
      { slug: "오룡동", name: "오룡동" },
      { slug: "수신면", name: "수신면" },
      { slug: "원성동", name: "원성동" },
      { slug: "북면", name: "북면" },
      { slug: "천안시동남구", name: "천안시동남구" },
      { slug: "성남면", name: "성남면" },
      { slug: "풍세면", name: "풍세면" }
    ] },
    { slug: "청양군", name: "청양군", nameEn: "", dongs: [
      { slug: "비봉면", name: "비봉면" },
      { slug: "목면", name: "목면" },
      { slug: "운곡면", name: "운곡면" },
      { slug: "대치면", name: "대치면" },
      { slug: "남양면", name: "남양면" },
      { slug: "화성면", name: "화성면" },
      { slug: "청남면", name: "청남면" },
      { slug: "정산면", name: "정산면" },
      { slug: "장평면", name: "장평면" },
      { slug: "청양군", name: "청양군" },
      { slug: "청양읍", name: "청양읍" }
    ] },
    { slug: "예산군", name: "예산군", nameEn: "", dongs: [
      { slug: "예산군", name: "예산군" },
      { slug: "예산읍", name: "예산읍" },
      { slug: "대흥면", name: "대흥면" },
      { slug: "응봉면", name: "응봉면" },
      { slug: "신양면", name: "신양면" },
      { slug: "대술면", name: "대술면" },
      { slug: "고덕면", name: "고덕면" },
      { slug: "신암면", name: "신암면" },
      { slug: "봉산면", name: "봉산면" },
      { slug: "삽교읍", name: "삽교읍" },
      { slug: "덕산면", name: "덕산면" },
      { slug: "광시면", name: "광시면" },
      { slug: "오가면", name: "오가면" }
    ] },
    { slug: "천안시", name: "천안시", nameEn: "", dongs: [
      { slug: "천안시", name: "천안시" }
    ] },
    { slug: "천안시 서북구", name: "천안시 서북구", nameEn: "", dongs: [
      { slug: "입장면", name: "입장면" },
      { slug: "천안시서북구", name: "천안시서북구" },
      { slug: "성환읍", name: "성환읍" },
      { slug: "성거읍", name: "성거읍" },
      { slug: "직산읍", name: "직산읍" },
      { slug: "와촌동", name: "와촌동" },
      { slug: "성정동", name: "성정동" },
      { slug: "쌍용동", name: "쌍용동" },
      { slug: "백석동", name: "백석동" },
      { slug: "불당동", name: "불당동" },
      { slug: "두정동", name: "두정동" },
      { slug: "업성동", name: "업성동" },
      { slug: "신당동", name: "신당동" },
      { slug: "부대동", name: "부대동" },
      { slug: "성성동", name: "성성동" },
      { slug: "차암동", name: "차암동" }
    ] },
    { slug: "천안시 동남구", name: "천안시 동남구", nameEn: "", dongs: [
      { slug: "다가동", name: "다가동" },
      { slug: "용곡동", name: "용곡동" },
      { slug: "신방동", name: "신방동" },
      { slug: "구성동", name: "구성동" },
      { slug: "청수동", name: "청수동" },
      { slug: "삼룡동", name: "삼룡동" },
      { slug: "청당동", name: "청당동" },
      { slug: "구룡동", name: "구룡동" },
      { slug: "원성동", name: "원성동" },
      { slug: "신부동", name: "신부동" },
      { slug: "안서동", name: "안서동" },
      { slug: "수신면", name: "수신면" },
      { slug: "병천면", name: "병천면" },
      { slug: "성남면", name: "성남면" },
      { slug: "동면", name: "동면" },
      { slug: "대흥동", name: "대흥동" },
      { slug: "사직동", name: "사직동" },
      { slug: "영성동", name: "영성동" },
      { slug: "오룡동", name: "오룡동" },
      { slug: "성황동", name: "성황동" },
      { slug: "문화동", name: "문화동" },
      { slug: "유량동", name: "유량동" },
      { slug: "봉명동", name: "봉명동" },
      { slug: "쌍용동", name: "쌍용동" },
      { slug: "북면", name: "북면" },
      { slug: "풍세면", name: "풍세면" },
      { slug: "천안시동남구", name: "천안시동남구" },
      { slug: "목천읍", name: "목천읍" },
      { slug: "광덕면", name: "광덕면" }
    ] }
  ],
    districtCount: 15,
    dongCount: 207,
    characteristics: {
      summary: "\uC218\uB3C4\uAD8C \uC5F0\uACC4 \uC0B0\uC5C5 \uAC70\uC810, \uBC31\uC81C \uC720\uC0B0\uACFC \uC11C\uD574\uC548 \uAD00\uAD11\uC774 \uACF5\uC874",
      storeTypes: ["\uACF5\uB2E8 \uC2DD\uB2F9\xB7\uCE74\uD398", "\uB300\uD559\uAC00 \uB9E4\uC7A5", "\uBC31\uC81C \uAD00\uAD11\uC9C0 \uCE74\uD398", "\uD574\uC548 \uC2DD\uB2F9"],
      customerBase: ["\uC0BC\uC131\xB7\uD604\uB300\uCC28 \uADFC\uB85C\uC790", "\uB300\uD559\uC0DD", "\uAD00\uAD11\uAC1D", "\uCDA9\uB0A8 \uB3C4\uBBFC"],
      businessHours: "\uACF5\uB2E8 3\uAD50\uB300 \uB300\uC751, \uC8FC\uB9D0 \uAD00\uAD11\uC9C0 \uC9D1\uC911"
    },
    businessEnvironment: {
      majorIndustries: ["\uBC18\uB3C4\uCCB4\xB7\uC790\uB3D9\uCC28", "\uC11D\uC720\uD654\uD559", "\uAD00\uAD11\xB7\uBB38\uD654\uC720\uC0B0", "\uB18D\xB7\uC218\uC0B0\uC5C5"],
      commercialAreas: ["\uCC9C\uC548 \uC2E0\uBD80\uB3D9", "\uC544\uC0B0 \uBC30\uBC29", "\uACF5\uC8FC \uC0B0\uC131\uB3D9", "\uC11C\uC0B0 \uB3D9\uBB38\uB3D9"],
      infrastructure: ["KTX \uCC9C\uC548\uC544\uC0B0\uC5ED", "\uC0BC\uC131\xB7\uD604\uB300\uCC28 \uACF5\uC7A5", "\uC11C\uD574\uC548\uACE0\uC18D\uB3C4\uB85C", "\uBC31\uC81C\uC5ED\uC0AC\uC720\uC801\uC9C0\uAD6C"]
    },
    installationTips: [
      "\uB300\uAE30\uC5C5 \uACF5\uB2E8 \uADFC\uB85C\uC790 \uB300\uC0C1 \uC57C\uAC04 \uC6B4\uC601",
      "\uBC31\uC81C\xB7\uC720\uB124\uC2A4\uCF54 \uAD00\uAD11\uC9C0 \uC678\uAD6D\uC5B4 \uC9C0\uC6D0",
      "\uC11C\uD574\uC548 \uD574\uC0B0\uBB3C \uC2DD\uB2F9 \uBC29\uC218 \uC7A5\uBE44",
      "\uD504\uB79C\uCC28\uC774\uC988 \uB2E4\uC810\uD3EC \uAD00\uB9AC \uC2DC\uC2A4\uD15C"
    ],
    featuredDistricts: [
      { name: "\uCC9C\uC548\uC2DC", description: "\uCDA9\uB0A8 \uCD5C\uB300 \uC0C1\uAD8C, \uC2E0\uBD80\uB3D9\xB7\uBD88\uB2F9\uB3D9 \uC911\uC2EC" },
      { name: "\uC544\uC0B0\uC2DC", description: "\uC0BC\uC131\xB7\uD604\uB300\uCC28 \uC784\uC9C1\uC6D0 \uB300\uC0C1 \uC0C1\uAD8C" },
      { name: "\uACF5\uC8FC\uC2DC", description: "\uBC31\uC81C \uBB38\uD654\uC720\uC0B0, \uC5ED\uC0AC \uAD00\uAD11\uC9C0 \uB9E4\uC7A5" },
      { name: "\uC11C\uC0B0\uC2DC", description: "\uC11D\uC720\uD654\uD559\uB2E8\uC9C0, \uADFC\uB85C\uC790 \uC0C1\uAD8C \uD65C\uBC1C" }
    ]
  },
  // ========================================
  // 전라북도
  // ========================================
  {
    code: "jeonbuk",
    nameKo: "\uC804\uBD81\uD2B9\uBCC4\uC790\uCE58\uB3C4",
    nameKoShort: "\uC804\uBD81",
    nameEn: "Jeonbuk",
    districts: [
    { slug: "무주군", name: "무주군", nameEn: "", dongs: [
      { slug: "적상면", name: "적상면" },
      { slug: "부남면", name: "부남면" },
      { slug: "무풍면", name: "무풍면" },
      { slug: "무주군", name: "무주군" },
      { slug: "무주읍", name: "무주읍" },
      { slug: "설천면", name: "설천면" },
      { slug: "안성면", name: "안성면" }
    ] },
    { slug: "남원시", name: "남원시", nameEn: "", dongs: [
      { slug: "내척동", name: "내척동" },
      { slug: "산곡동", name: "산곡동" },
      { slug: "도통동", name: "도통동" },
      { slug: "월락동", name: "월락동" },
      { slug: "인월면", name: "인월면" },
      { slug: "동충동", name: "동충동" },
      { slug: "하정동", name: "하정동" },
      { slug: "산동면", name: "산동면" },
      { slug: "덕과면", name: "덕과면" },
      { slug: "산내면", name: "산내면" },
      { slug: "사매면", name: "사매면" },
      { slug: "노암동", name: "노암동" },
      { slug: "수지면", name: "수지면" },
      { slug: "아영면", name: "아영면" },
      { slug: "금지면", name: "금지면" },
      { slug: "송동면", name: "송동면" },
      { slug: "대산면", name: "대산면" },
      { slug: "주생면", name: "주생면" },
      { slug: "주천면", name: "주천면" },
      { slug: "남원시", name: "남원시" },
      { slug: "식정동", name: "식정동" },
      { slug: "갈치동", name: "갈치동" },
      { slug: "이백면", name: "이백면" },
      { slug: "대강면", name: "대강면" },
      { slug: "보절면", name: "보절면" },
      { slug: "어현동", name: "어현동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "운봉읍", name: "운봉읍" },
      { slug: "죽항동", name: "죽항동" },
      { slug: "쌍교동", name: "쌍교동" },
      { slug: "천거동", name: "천거동" },
      { slug: "금동", name: "금동" },
      { slug: "조산동", name: "조산동" },
      { slug: "왕정동", name: "왕정동" },
      { slug: "신정동", name: "신정동" },
      { slug: "화정동", name: "화정동" },
      { slug: "향교동", name: "향교동" },
      { slug: "용정동", name: "용정동" },
      { slug: "광치동", name: "광치동" },
      { slug: "고죽동", name: "고죽동" }
    ] },
    { slug: "고창군", name: "고창군", nameEn: "", dongs: [
      { slug: "흥덕면", name: "흥덕면" },
      { slug: "해리면", name: "해리면" },
      { slug: "아산면", name: "아산면" },
      { slug: "심원면", name: "심원면" },
      { slug: "부안면", name: "부안면" },
      { slug: "상하면", name: "상하면" },
      { slug: "고창군", name: "고창군" },
      { slug: "대산면", name: "대산면" },
      { slug: "성내면", name: "성내면" },
      { slug: "신림면", name: "신림면" },
      { slug: "고수면", name: "고수면" },
      { slug: "성송면", name: "성송면" },
      { slug: "고창읍", name: "고창읍" },
      { slug: "공음면", name: "공음면" },
      { slug: "무장면", name: "무장면" }
    ] },
    { slug: "정읍시", name: "정읍시", nameEn: "", dongs: [
      { slug: "옹동면", name: "옹동면" },
      { slug: "고부면", name: "고부면" },
      { slug: "정우면", name: "정우면" },
      { slug: "태인면", name: "태인면" },
      { slug: "농소동", name: "농소동" },
      { slug: "하모동", name: "하모동" },
      { slug: "상평동", name: "상평동" },
      { slug: "과교동", name: "과교동" },
      { slug: "삼산동", name: "삼산동" },
      { slug: "진산동", name: "진산동" },
      { slug: "금붕동", name: "금붕동" },
      { slug: "송산동", name: "송산동" },
      { slug: "신월동", name: "신월동" },
      { slug: "산내면", name: "산내면" },
      { slug: "영원면", name: "영원면" },
      { slug: "망제동", name: "망제동" },
      { slug: "신정동", name: "신정동" },
      { slug: "신태인읍", name: "신태인읍" },
      { slug: "흑암동", name: "흑암동" },
      { slug: "소성면", name: "소성면" },
      { slug: "입암면", name: "입암면" },
      { slug: "이평면", name: "이평면" },
      { slug: "용산동", name: "용산동" },
      { slug: "교암동", name: "교암동" },
      { slug: "부전동", name: "부전동" },
      { slug: "쌍암동", name: "쌍암동" },
      { slug: "내장동", name: "내장동" },
      { slug: "영파동", name: "영파동" },
      { slug: "하북동", name: "하북동" },
      { slug: "구룡동", name: "구룡동" },
      { slug: "장명동", name: "장명동" },
      { slug: "수성동", name: "수성동" },
      { slug: "북면", name: "북면" },
      { slug: "감곡면", name: "감곡면" },
      { slug: "상동", name: "상동" },
      { slug: "시기동", name: "시기동" },
      { slug: "용계동", name: "용계동" },
      { slug: "공평동", name: "공평동" },
      { slug: "칠보면", name: "칠보면" },
      { slug: "연지동", name: "연지동" },
      { slug: "정읍시", name: "정읍시" },
      { slug: "산외면", name: "산외면" },
      { slug: "덕천면", name: "덕천면" }
    ] },
    { slug: "전주시완산구", name: "전주시완산구", nameEn: "", dongs: [
      { slug: "서신동", name: "서신동" },
      { slug: "석구동", name: "석구동" },
      { slug: "원당동", name: "원당동" },
      { slug: "고사동", name: "고사동" },
      { slug: "교동", name: "교동" },
      { slug: "전주시완산구", name: "전주시완산구" },
      { slug: "중앙동1가", name: "중앙동1가" },
      { slug: "중앙동2가", name: "중앙동2가" },
      { slug: "태평동", name: "태평동" },
      { slug: "색장동", name: "색장동" },
      { slug: "상림동", name: "상림동" },
      { slug: "서노송동", name: "서노송동" },
      { slug: "삼천동1가", name: "삼천동1가" },
      { slug: "효자동3가", name: "효자동3가" },
      { slug: "대성동", name: "대성동" },
      { slug: "효자동2가", name: "효자동2가" },
      { slug: "중앙동4가", name: "중앙동4가" },
      { slug: "경원동1가", name: "경원동1가" },
      { slug: "경원동2가", name: "경원동2가" },
      { slug: "경원동3가", name: "경원동3가" },
      { slug: "효자동1가", name: "효자동1가" },
      { slug: "풍남동1가", name: "풍남동1가" },
      { slug: "풍남동2가", name: "풍남동2가" },
      { slug: "풍남동3가", name: "풍남동3가" },
      { slug: "평화동1가", name: "평화동1가" },
      { slug: "중노송동", name: "중노송동" },
      { slug: "남노송동", name: "남노송동" },
      { slug: "전동", name: "전동" },
      { slug: "전동3가", name: "전동3가" },
      { slug: "중화산동2가", name: "중화산동2가" },
      { slug: "동완산동", name: "동완산동" },
      { slug: "서완산동1가", name: "서완산동1가" },
      { slug: "서완산동2가", name: "서완산동2가" },
      { slug: "동서학동", name: "동서학동" },
      { slug: "서서학동", name: "서서학동" },
      { slug: "중화산동1가", name: "중화산동1가" },
      { slug: "삼천동2가", name: "삼천동2가" },
      { slug: "삼천동3가", name: "삼천동3가" },
      { slug: "중인동", name: "중인동" },
      { slug: "용복동", name: "용복동" },
      { slug: "다가동1가", name: "다가동1가" },
      { slug: "다가동2가", name: "다가동2가" },
      { slug: "다가동3가", name: "다가동3가" },
      { slug: "다가동4가", name: "다가동4가" },
      { slug: "평화동2가", name: "평화동2가" },
      { slug: "평화동3가", name: "평화동3가" },
      { slug: "중앙동3가", name: "중앙동3가" }
    ] },
    { slug: "완주군", name: "완주군", nameEn: "", dongs: [
      { slug: "운주면", name: "운주면" },
      { slug: "봉동읍", name: "봉동읍" },
      { slug: "경천면", name: "경천면" },
      { slug: "고산면", name: "고산면" },
      { slug: "화산면", name: "화산면" },
      { slug: "이서면", name: "이서면" },
      { slug: "용진읍", name: "용진읍" },
      { slug: "구이면", name: "구이면" },
      { slug: "비봉면", name: "비봉면" },
      { slug: "상관면", name: "상관면" },
      { slug: "동상면", name: "동상면" },
      { slug: "완주군", name: "완주군" },
      { slug: "삼례읍", name: "삼례읍" },
      { slug: "소양면", name: "소양면" }
    ] },
    { slug: "익산시", name: "익산시", nameEn: "", dongs: [
      { slug: "낭산면", name: "낭산면" },
      { slug: "삼기면", name: "삼기면" },
      { slug: "망성면", name: "망성면" },
      { slug: "평화동", name: "평화동" },
      { slug: "갈산동", name: "갈산동" },
      { slug: "주현동", name: "주현동" },
      { slug: "인화동1가", name: "인화동1가" },
      { slug: "어양동", name: "어양동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "금강동", name: "금강동" },
      { slug: "석탄동", name: "석탄동" },
      { slug: "팔봉동", name: "팔봉동" },
      { slug: "덕기동", name: "덕기동" },
      { slug: "용제동", name: "용제동" },
      { slug: "만석동", name: "만석동" },
      { slug: "현영동", name: "현영동" },
      { slug: "신용동", name: "신용동" },
      { slug: "신동", name: "신동" },
      { slug: "영등동", name: "영등동" },
      { slug: "창인동1가", name: "창인동1가" },
      { slug: "창인동2가", name: "창인동2가" },
      { slug: "중앙동1가", name: "중앙동1가" },
      { slug: "익산시", name: "익산시" },
      { slug: "석암동", name: "석암동" },
      { slug: "함열읍", name: "함열읍" },
      { slug: "함라면", name: "함라면" },
      { slug: "중앙동2가", name: "중앙동2가" },
      { slug: "용동면", name: "용동면" },
      { slug: "용안면", name: "용안면" },
      { slug: "여산면", name: "여산면" },
      { slug: "모현동2가", name: "모현동2가" },
      { slug: "송학동", name: "송학동" },
      { slug: "목천동", name: "목천동" },
      { slug: "성당면", name: "성당면" },
      { slug: "중앙동3가", name: "중앙동3가" },
      { slug: "왕궁면", name: "왕궁면" },
      { slug: "은기동", name: "은기동" },
      { slug: "정족동", name: "정족동" },
      { slug: "임상동", name: "임상동" },
      { slug: "월성동", name: "월성동" },
      { slug: "오산면", name: "오산면" },
      { slug: "금마면", name: "금마면" },
      { slug: "춘포면", name: "춘포면" },
      { slug: "석왕동", name: "석왕동" },
      { slug: "부송동", name: "부송동" },
      { slug: "황등면", name: "황등면" },
      { slug: "인화동2가", name: "인화동2가" },
      { slug: "동산동", name: "동산동" },
      { slug: "마동", name: "마동" },
      { slug: "남중동", name: "남중동" },
      { slug: "모현동1가", name: "모현동1가" },
      { slug: "웅포면", name: "웅포면" }
    ] },
    { slug: "임실군", name: "임실군", nameEn: "", dongs: [
      { slug: "강진면", name: "강진면" },
      { slug: "덕치면", name: "덕치면" },
      { slug: "신덕면", name: "신덕면" },
      { slug: "오수면", name: "오수면" },
      { slug: "임실군", name: "임실군" },
      { slug: "관촌면", name: "관촌면" },
      { slug: "삼계면", name: "삼계면" },
      { slug: "청웅면", name: "청웅면" },
      { slug: "운암면", name: "운암면" },
      { slug: "지사면", name: "지사면" },
      { slug: "신평면", name: "신평면" },
      { slug: "임실읍", name: "임실읍" },
      { slug: "성수면", name: "성수면" }
    ] },
    { slug: "군산시", name: "군산시", nameEn: "", dongs: [
      { slug: "중앙로2가", name: "중앙로2가" },
      { slug: "신관동", name: "신관동" },
      { slug: "옥도면", name: "옥도면" },
      { slug: "경암동", name: "경암동" },
      { slug: "구암동", name: "구암동" },
      { slug: "내흥동", name: "내흥동" },
      { slug: "미장동", name: "미장동" },
      { slug: "지곡동", name: "지곡동" },
      { slug: "나운동", name: "나운동" },
      { slug: "미룡동", name: "미룡동" },
      { slug: "소룡동", name: "소룡동" },
      { slug: "오식도동", name: "오식도동" },
      { slug: "대야면", name: "대야면" },
      { slug: "개사동", name: "개사동" },
      { slug: "중앙로3가", name: "중앙로3가" },
      { slug: "비응도동", name: "비응도동" },
      { slug: "오룡동", name: "오룡동" },
      { slug: "금광동", name: "금광동" },
      { slug: "신풍동", name: "신풍동" },
      { slug: "송풍동", name: "송풍동" },
      { slug: "신창동", name: "신창동" },
      { slug: "회현면", name: "회현면" },
      { slug: "개정동", name: "개정동" },
      { slug: "사정동", name: "사정동" },
      { slug: "수송동", name: "수송동" },
      { slug: "내초동", name: "내초동" },
      { slug: "옥구읍", name: "옥구읍" },
      { slug: "월명동", name: "월명동" },
      { slug: "개정면", name: "개정면" },
      { slug: "성산면", name: "성산면" },
      { slug: "옥산면", name: "옥산면" },
      { slug: "해망동", name: "해망동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "금동", name: "금동" },
      { slug: "서수면", name: "서수면" },
      { slug: "개복동", name: "개복동" },
      { slug: "중앙로1가", name: "중앙로1가" },
      { slug: "영화동", name: "영화동" },
      { slug: "장미동", name: "장미동" },
      { slug: "옥서면", name: "옥서면" },
      { slug: "나포면", name: "나포면" },
      { slug: "문화동", name: "문화동" },
      { slug: "삼학동", name: "삼학동" },
      { slug: "선양동", name: "선양동" },
      { slug: "둔율동", name: "둔율동" },
      { slug: "창성동", name: "창성동" },
      { slug: "명산동", name: "명산동" },
      { slug: "송창동", name: "송창동" },
      { slug: "군산시", name: "군산시" },
      { slug: "대명동", name: "대명동" },
      { slug: "장재동", name: "장재동" },
      { slug: "미원동", name: "미원동" },
      { slug: "중동", name: "중동" },
      { slug: "금암동", name: "금암동" },
      { slug: "동흥남동", name: "동흥남동" },
      { slug: "서흥남동", name: "서흥남동" },
      { slug: "조촌동", name: "조촌동" },
      { slug: "산북동", name: "산북동" },
      { slug: "임피면", name: "임피면" },
      { slug: "경장동", name: "경장동" },
      { slug: "영동", name: "영동" },
      { slug: "신영동", name: "신영동" },
      { slug: "죽성동", name: "죽성동" },
      { slug: "평화동", name: "평화동" }
    ] },
    { slug: "전주시덕진구", name: "전주시덕진구", nameEn: "", dongs: [
      { slug: "우아동3가", name: "우아동3가" },
      { slug: "호성동1가", name: "호성동1가" },
      { slug: "전주시덕진구", name: "전주시덕진구" },
      { slug: "팔복동2가", name: "팔복동2가" },
      { slug: "팔복동3가", name: "팔복동3가" },
      { slug: "산정동", name: "산정동" },
      { slug: "금상동", name: "금상동" },
      { slug: "송천동2가", name: "송천동2가" },
      { slug: "송천동1가", name: "송천동1가" },
      { slug: "우아동1가", name: "우아동1가" },
      { slug: "우아동2가", name: "우아동2가" },
      { slug: "도덕동", name: "도덕동" },
      { slug: "만성동", name: "만성동" },
      { slug: "장동", name: "장동" },
      { slug: "강흥동", name: "강흥동" },
      { slug: "진북동", name: "진북동" },
      { slug: "인후동1가", name: "인후동1가" },
      { slug: "도도동", name: "도도동" },
      { slug: "호성동3가", name: "호성동3가" },
      { slug: "호성동2가", name: "호성동2가" },
      { slug: "인후동2가", name: "인후동2가" },
      { slug: "덕진동1가", name: "덕진동1가" },
      { slug: "덕진동2가", name: "덕진동2가" },
      { slug: "금암동", name: "금암동" },
      { slug: "팔복동1가", name: "팔복동1가" },
      { slug: "팔복동4가", name: "팔복동4가" },
      { slug: "여의동2가", name: "여의동2가" },
      { slug: "고랑동", name: "고랑동" },
      { slug: "여의동", name: "여의동" },
      { slug: "전미동1가", name: "전미동1가" },
      { slug: "전미동2가", name: "전미동2가" },
      { slug: "용정동", name: "용정동" },
      { slug: "성덕동", name: "성덕동" },
      { slug: "원동", name: "원동" },
      { slug: "반월동", name: "반월동" },
      { slug: "화전동", name: "화전동" },
      { slug: "남정동", name: "남정동" },
      { slug: "중동", name: "중동" }
    ] },
    { slug: "김제시", name: "김제시", nameEn: "", dongs: [
      { slug: "죽산면", name: "죽산면" },
      { slug: "황산동", name: "황산동" },
      { slug: "난봉동", name: "난봉동" },
      { slug: "광활면", name: "광활면" },
      { slug: "용지면", name: "용지면" },
      { slug: "백구면", name: "백구면" },
      { slug: "금구면", name: "금구면" },
      { slug: "명덕동", name: "명덕동" },
      { slug: "황산면", name: "황산면" },
      { slug: "백산면", name: "백산면" },
      { slug: "성덕면", name: "성덕면" },
      { slug: "연정동", name: "연정동" },
      { slug: "백학동", name: "백학동" },
      { slug: "서암동", name: "서암동" },
      { slug: "신곡동", name: "신곡동" },
      { slug: "교동", name: "교동" },
      { slug: "옥산동", name: "옥산동" },
      { slug: "갈공동", name: "갈공동" },
      { slug: "하동", name: "하동" },
      { slug: "흥사동", name: "흥사동" },
      { slug: "상동동", name: "상동동" },
      { slug: "월성동", name: "월성동" },
      { slug: "신덕동", name: "신덕동" },
      { slug: "월봉동", name: "월봉동" },
      { slug: "신월동", name: "신월동" },
      { slug: "신풍동", name: "신풍동" },
      { slug: "용동", name: "용동" },
      { slug: "검산동", name: "검산동" },
      { slug: "부량면", name: "부량면" },
      { slug: "공덕면", name: "공덕면" },
      { slug: "입석동", name: "입석동" },
      { slug: "장화동", name: "장화동" },
      { slug: "복죽동", name: "복죽동" },
      { slug: "순동", name: "순동" },
      { slug: "김제시", name: "김제시" },
      { slug: "요촌동", name: "요촌동" },
      { slug: "진봉면", name: "진봉면" },
      { slug: "오정동", name: "오정동" },
      { slug: "봉남면", name: "봉남면" },
      { slug: "제월동", name: "제월동" },
      { slug: "도장동", name: "도장동" },
      { slug: "서정동", name: "서정동" },
      { slug: "양전동", name: "양전동" },
      { slug: "만경읍", name: "만경읍" },
      { slug: "금산면", name: "금산면" },
      { slug: "청하면", name: "청하면" }
    ] },
    { slug: "전주시", name: "전주시", nameEn: "", dongs: [
      { slug: "전주시", name: "전주시" }
    ] },
    { slug: "부안군", name: "부안군", nameEn: "", dongs: [
      { slug: "하서면", name: "하서면" },
      { slug: "보안면", name: "보안면" },
      { slug: "행안면", name: "행안면" },
      { slug: "주산면", name: "주산면" },
      { slug: "동진면", name: "동진면" },
      { slug: "계화면", name: "계화면" },
      { slug: "줄포면", name: "줄포면" },
      { slug: "변산면", name: "변산면" },
      { slug: "진서면", name: "진서면" },
      { slug: "부안군", name: "부안군" },
      { slug: "부안읍", name: "부안읍" },
      { slug: "백산면", name: "백산면" },
      { slug: "상서면", name: "상서면" },
      { slug: "위도면", name: "위도면" }
    ] },
    { slug: "진안군", name: "진안군", nameEn: "", dongs: [
      { slug: "동향면", name: "동향면" },
      { slug: "백운면", name: "백운면" },
      { slug: "마령면", name: "마령면" },
      { slug: "부귀면", name: "부귀면" },
      { slug: "상전면", name: "상전면" },
      { slug: "진안읍", name: "진안읍" },
      { slug: "용담면", name: "용담면" },
      { slug: "성수면", name: "성수면" },
      { slug: "정천면", name: "정천면" },
      { slug: "주천면", name: "주천면" },
      { slug: "진안군", name: "진안군" },
      { slug: "안천면", name: "안천면" }
    ] },
    { slug: "장수군", name: "장수군", nameEn: "", dongs: [
      { slug: "장계면", name: "장계면" },
      { slug: "산서면", name: "산서면" },
      { slug: "장수군", name: "장수군" },
      { slug: "장수읍", name: "장수읍" },
      { slug: "천천면", name: "천천면" },
      { slug: "계남면", name: "계남면" },
      { slug: "번암면", name: "번암면" },
      { slug: "계북면", name: "계북면" }
    ] },
    { slug: "순창군", name: "순창군", nameEn: "", dongs: [
      { slug: "구림면", name: "구림면" },
      { slug: "동계면", name: "동계면" },
      { slug: "복흥면", name: "복흥면" },
      { slug: "순창군", name: "순창군" },
      { slug: "순창읍", name: "순창읍" },
      { slug: "풍산면", name: "풍산면" },
      { slug: "유등면", name: "유등면" },
      { slug: "팔덕면", name: "팔덕면" },
      { slug: "적성면", name: "적성면" },
      { slug: "쌍치면", name: "쌍치면" },
      { slug: "인계면", name: "인계면" },
      { slug: "금과면", name: "금과면" }
    ] }
  ],
    districtCount: 14,
    dongCount: 241,
    characteristics: {
      summary: "\uD55C\uC625\uB9C8\uC744\xB7\uD55C\uC2DD \uBB38\uD654\uC758 \uC911\uC2EC\uC9C0, \uC804\uD1B5\uACFC \uD604\uB300\uAC00 \uC5B4\uC6B0\uB7EC\uC9C4 \uAD00\uAD11 \uC9C0\uC5ED",
      storeTypes: ["\uD55C\uC625 \uCE74\uD398\xB7\uC2DD\uB2F9", "\uC804\uC8FC\uBE44\uBE54\uBC25 \uC804\uBB38\uC810", "\uD55C\uBCF5 \uB300\uC5EC\uC810", "\uAD00\uAD11\uC9C0 \uAE30\uB150\uD488\uC810"],
      customerBase: ["\uAD6D\uB0B4\uC678 \uAD00\uAD11\uAC1D", "\uC804\uBD81 \uB3C4\uBBFC", "\uBB38\uD654\xB7\uC608\uC220 \uAD00\uACC4\uC790", "\uD559\uC0DD"],
      businessHours: "\uC8FC\uB9D0\xB7\uC131\uC218\uAE30 \uC2EC\uC57C \uC6B4\uC601, \uD3C9\uC77C \uC810\uC2EC\xB7\uC800\uB141 \uC9D1\uC911"
    },
    businessEnvironment: {
      majorIndustries: ["\uAD00\uAD11\xB7\uBB38\uD654", "\uD55C\uC2DD\xB7\uC74C\uC2DD\uC5C5", "\uC790\uB3D9\uCC28\xB7\uC870\uC120", "\uB18D\xB7\uCD95\uC0B0\uC5C5"],
      commercialAreas: ["\uC804\uC8FC \uD55C\uC625\uB9C8\uC744", "\uAD70\uC0B0 \uADFC\uB300\uBB38\uD654\uAC70\uB9AC", "\uC775\uC0B0 \uC601\uB4F1\uB3D9", "\uC815\uC74D \uC2DC\uAE30\uB3D9"],
      infrastructure: ["KTX \uC804\uC8FC\xB7\uC775\uC0B0", "\uC0C8\uB9CC\uAE08 \uAC1C\uBC1C", "\uAD70\uC0B0\uD56D", "\uBC31\uC591\uC0AC\xB7\uB0B4\uC7A5\uC0AC"]
    },
    installationTips: [
      "\uD55C\uC625\uB9C8\uC744 \uC804\uD1B5 \uAC00\uC625 \uB9E4\uC7A5\uC758 \uCD5C\uC2E0 \uC7A5\uBE44 \uC735\uD569",
      "\uC678\uAD6D\uC778 \uAD00\uAD11\uAC1D \uB300\uC0C1 \uB2E4\uAD6D\uC5B4\xB7\uD55C\uC2DD \uBA54\uB274 \uC124\uBA85",
      "\uD55C\uBCF5\xB7\uC804\uD1B5 \uCCB4\uD5D8 \uB9E4\uC7A5\uC758 \uC608\uC57D \uC2DC\uC2A4\uD15C",
      "\uC9C0\uC5ED \uD2B9\uC0B0\uD488\xB7\uACF5\uC608\uD488 \uD310\uB9E4 POS"
    ],
    featuredDistricts: [
      { name: "\uC804\uC8FC\uC2DC", description: "\uD55C\uC625\uB9C8\uC744\xB7\uAC1D\uB9AC\uB2E8\uAE38, \uAD00\uAD11 1\uBC88\uC9C0" },
      { name: "\uAD70\uC0B0\uC2DC", description: "\uADFC\uB300\uBB38\uD654\uAC70\uB9AC, \uC77C\uC81C\uAC15\uC810\uAE30 \uC720\uC0B0 \uAD00\uAD11" },
      { name: "\uC775\uC0B0\uC2DC", description: "\uBC31\uC81C\uC720\uC801\uC9C0\uAD6C, \uC5ED\uC0AC \uAD00\uAD11 \uC778\uD504\uB77C" },
      { name: "\uC815\uC74D\uC2DC", description: "\uB0B4\uC7A5\uC0B0 \uAD00\uAD11, \uD55C\uC2DD \uD2B9\uD654 \uB9E4\uC7A5" }
    ]
  },
  // ========================================
  // 전라남도
  // ========================================
  {
    code: "jeonnam",
    nameKo: "\uC804\uB77C\uB0A8\uB3C4",
    nameKoShort: "\uC804\uB0A8",
    nameEn: "Jeonnam",
    districts: [
    { slug: "목포시", name: "목포시", nameEn: "", dongs: [
      { slug: "중앙동1가", name: "중앙동1가" },
      { slug: "대의동1가", name: "대의동1가" },
      { slug: "대의동2가", name: "대의동2가" },
      { slug: "대의동3가", name: "대의동3가" },
      { slug: "용당동", name: "용당동" },
      { slug: "산정동", name: "산정동" },
      { slug: "용해동", name: "용해동" },
      { slug: "석현동", name: "석현동" },
      { slug: "대성동", name: "대성동" },
      { slug: "중앙동3가", name: "중앙동3가" },
      { slug: "만호동", name: "만호동" },
      { slug: "수강동1가", name: "수강동1가" },
      { slug: "수강동2가", name: "수강동2가" },
      { slug: "해안동1가", name: "해안동1가" },
      { slug: "해안동2가", name: "해안동2가" },
      { slug: "해안동3가", name: "해안동3가" },
      { slug: "해안동4가", name: "해안동4가" },
      { slug: "항동", name: "항동" },
      { slug: "중동1가", name: "중동1가" },
      { slug: "중동2가", name: "중동2가" },
      { slug: "유동", name: "유동" },
      { slug: "중앙동2가", name: "중앙동2가" },
      { slug: "상동", name: "상동" },
      { slug: "광동1가", name: "광동1가" },
      { slug: "남교동", name: "남교동" },
      { slug: "호남동", name: "호남동" },
      { slug: "광동2가", name: "광동2가" },
      { slug: "광동3가", name: "광동3가" },
      { slug: "영해동1가", name: "영해동1가" },
      { slug: "영해동2가", name: "영해동2가" },
      { slug: "대안동", name: "대안동" },
      { slug: "창평동", name: "창평동" },
      { slug: "연산동", name: "연산동" },
      { slug: "북교동", name: "북교동" },
      { slug: "명륜동", name: "명륜동" },
      { slug: "죽동", name: "죽동" },
      { slug: "무안동", name: "무안동" },
      { slug: "측후동", name: "측후동" },
      { slug: "상락동1가", name: "상락동1가" },
      { slug: "달동", name: "달동" },
      { slug: "율도동", name: "율도동" },
      { slug: "목포시", name: "목포시" },
      { slug: "경동2가", name: "경동2가" },
      { slug: "서산동", name: "서산동" },
      { slug: "금화동", name: "금화동" },
      { slug: "온금동", name: "온금동" },
      { slug: "죽교동", name: "죽교동" },
      { slug: "동명동", name: "동명동" },
      { slug: "보광동2가", name: "보광동2가" },
      { slug: "보광동3가", name: "보광동3가" },
      { slug: "유달동", name: "유달동" },
      { slug: "금동1가", name: "금동1가" },
      { slug: "금동2가", name: "금동2가" },
      { slug: "경동1가", name: "경동1가" },
      { slug: "대양동", name: "대양동" },
      { slug: "옥암동", name: "옥암동" },
      { slug: "상락동2가", name: "상락동2가" },
      { slug: "복만동", name: "복만동" },
      { slug: "양동", name: "양동" },
      { slug: "행복동1가", name: "행복동1가" },
      { slug: "행복동2가", name: "행복동2가" },
      { slug: "축복동1가", name: "축복동1가" },
      { slug: "축복동2가", name: "축복동2가" },
      { slug: "축복동3가", name: "축복동3가" },
      { slug: "보광동1가", name: "보광동1가" }
    ] },
    { slug: "나주시", name: "나주시", nameEn: "", dongs: [
      { slug: "나주시", name: "나주시" },
      { slug: "토계동", name: "토계동" },
      { slug: "진포동", name: "진포동" },
      { slug: "빛가람동", name: "빛가람동" },
      { slug: "노안면", name: "노안면" },
      { slug: "다도면", name: "다도면" },
      { slug: "송월동", name: "송월동" },
      { slug: "안창동", name: "안창동" },
      { slug: "삼영동", name: "삼영동" },
      { slug: "오량동", name: "오량동" },
      { slug: "봉황면", name: "봉황면" },
      { slug: "공산면", name: "공산면" },
      { slug: "다시면", name: "다시면" },
      { slug: "세지면", name: "세지면" },
      { slug: "산포면", name: "산포면" },
      { slug: "금천면", name: "금천면" },
      { slug: "삼도동", name: "삼도동" },
      { slug: "영산동", name: "영산동" },
      { slug: "이창동", name: "이창동" },
      { slug: "남평읍", name: "남평읍" },
      { slug: "동강면", name: "동강면" },
      { slug: "서내동", name: "서내동" },
      { slug: "산정동", name: "산정동" },
      { slug: "경현동", name: "경현동" },
      { slug: "보산동", name: "보산동" },
      { slug: "금계동", name: "금계동" },
      { slug: "금성동", name: "금성동" },
      { slug: "남내동", name: "남내동" },
      { slug: "과원동", name: "과원동" },
      { slug: "성북동", name: "성북동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "대호동", name: "대호동" },
      { slug: "송촌동", name: "송촌동" },
      { slug: "석현동", name: "석현동" },
      { slug: "청동", name: "청동" },
      { slug: "남외동", name: "남외동" },
      { slug: "죽림동", name: "죽림동" },
      { slug: "평산동", name: "평산동" },
      { slug: "부덕동", name: "부덕동" },
      { slug: "대기동", name: "대기동" },
      { slug: "운곡동", name: "운곡동" },
      { slug: "동수동", name: "동수동" },
      { slug: "문평면", name: "문평면" },
      { slug: "반남면", name: "반남면" },
      { slug: "왕곡면", name: "왕곡면" },
      { slug: "교동", name: "교동" },
      { slug: "용산동", name: "용산동" },
      { slug: "관정동", name: "관정동" }
    ] },
    { slug: "보성군", name: "보성군", nameEn: "", dongs: [
      { slug: "웅치면", name: "웅치면" },
      { slug: "벌교읍", name: "벌교읍" },
      { slug: "문덕면", name: "문덕면" },
      { slug: "보성군", name: "보성군" },
      { slug: "율어면", name: "율어면" },
      { slug: "조성면", name: "조성면" },
      { slug: "겸백면", name: "겸백면" },
      { slug: "득량면", name: "득량면" },
      { slug: "미력면", name: "미력면" },
      { slug: "회천면", name: "회천면" },
      { slug: "노동면", name: "노동면" },
      { slug: "보성읍", name: "보성읍" },
      { slug: "복내면", name: "복내면" }
    ] },
    { slug: "영암군", name: "영암군", nameEn: "", dongs: [
      { slug: "삼호읍", name: "삼호읍" },
      { slug: "영암읍", name: "영암읍" },
      { slug: "서호면", name: "서호면" },
      { slug: "금정면", name: "금정면" },
      { slug: "학산면", name: "학산면" },
      { slug: "신북면", name: "신북면" },
      { slug: "시종면", name: "시종면" },
      { slug: "미암면", name: "미암면" },
      { slug: "덕진면", name: "덕진면" },
      { slug: "영암군", name: "영암군" },
      { slug: "도포면", name: "도포면" },
      { slug: "군서면", name: "군서면" }
    ] },
    { slug: "곡성군", name: "곡성군", nameEn: "", dongs: [
      { slug: "곡성군", name: "곡성군" },
      { slug: "곡성읍", name: "곡성읍" },
      { slug: "삼기면", name: "삼기면" },
      { slug: "목사동면", name: "목사동면" },
      { slug: "고달면", name: "고달면" },
      { slug: "옥과면", name: "옥과면" },
      { slug: "석곡면", name: "석곡면" },
      { slug: "죽곡면", name: "죽곡면" },
      { slug: "오곡면", name: "오곡면" },
      { slug: "겸면", name: "겸면" },
      { slug: "입면", name: "입면" },
      { slug: "오산면", name: "오산면" }
    ] },
    { slug: "영광군", name: "영광군", nameEn: "", dongs: [
      { slug: "묘량면", name: "묘량면" },
      { slug: "홍농읍", name: "홍농읍" },
      { slug: "군서면", name: "군서면" },
      { slug: "백수읍", name: "백수읍" },
      { slug: "불갑면", name: "불갑면" },
      { slug: "영광군", name: "영광군" },
      { slug: "영광읍", name: "영광읍" },
      { slug: "낙월면", name: "낙월면" },
      { slug: "염산면", name: "염산면" },
      { slug: "법성면", name: "법성면" },
      { slug: "군남면", name: "군남면" },
      { slug: "대마면", name: "대마면" }
    ] },
    { slug: "고흥군", name: "고흥군", nameEn: "", dongs: [
      { slug: "두원면", name: "두원면" },
      { slug: "대서면", name: "대서면" },
      { slug: "남양면", name: "남양면" },
      { slug: "영남면", name: "영남면" },
      { slug: "봉래면", name: "봉래면" },
      { slug: "동일면", name: "동일면" },
      { slug: "도양읍", name: "도양읍" },
      { slug: "도화면", name: "도화면" },
      { slug: "포두면", name: "포두면" },
      { slug: "금산면", name: "금산면" },
      { slug: "고흥군", name: "고흥군" },
      { slug: "고흥읍", name: "고흥읍" },
      { slug: "과역면", name: "과역면" },
      { slug: "도덕면", name: "도덕면" },
      { slug: "점암면", name: "점암면" },
      { slug: "풍양면", name: "풍양면" },
      { slug: "동강면", name: "동강면" }
    ] },
    { slug: "무안군", name: "무안군", nameEn: "", dongs: [
      { slug: "현경면", name: "현경면" },
      { slug: "망운면", name: "망운면" },
      { slug: "일로읍", name: "일로읍" },
      { slug: "삼향읍", name: "삼향읍" },
      { slug: "청계면", name: "청계면" },
      { slug: "무안군", name: "무안군" },
      { slug: "운남면", name: "운남면" },
      { slug: "해제면", name: "해제면" },
      { slug: "몽탄면", name: "몽탄면" },
      { slug: "무안읍", name: "무안읍" }
    ] },
    { slug: "구례군", name: "구례군", nameEn: "", dongs: [
      { slug: "간전면", name: "간전면" },
      { slug: "산동면", name: "산동면" },
      { slug: "마산면", name: "마산면" },
      { slug: "용방면", name: "용방면" },
      { slug: "구례군", name: "구례군" },
      { slug: "구례읍", name: "구례읍" },
      { slug: "문척면", name: "문척면" },
      { slug: "토지면", name: "토지면" },
      { slug: "광의면", name: "광의면" }
    ] },
    { slug: "화순군", name: "화순군", nameEn: "", dongs: [
      { slug: "도곡면", name: "도곡면" },
      { slug: "이양면", name: "이양면" },
      { slug: "도암면", name: "도암면" },
      { slug: "한천면", name: "한천면" },
      { slug: "춘양면", name: "춘양면" },
      { slug: "화순군", name: "화순군" },
      { slug: "화순읍", name: "화순읍" },
      { slug: "동면", name: "동면" },
      { slug: "사평면", name: "사평면" },
      { slug: "동복면", name: "동복면" },
      { slug: "백아면", name: "백아면" },
      { slug: "이서면", name: "이서면" },
      { slug: "청풍면", name: "청풍면" },
      { slug: "능주면", name: "능주면" },
      { slug: "남면", name: "남면" },
      { slug: "북면", name: "북면" }
    ] },
    { slug: "광양시", name: "광양시", nameEn: "", dongs: [
      { slug: "봉강면", name: "봉강면" },
      { slug: "진상면", name: "진상면" },
      { slug: "광양시", name: "광양시" },
      { slug: "황금동", name: "황금동" },
      { slug: "황길동", name: "황길동" },
      { slug: "도이동", name: "도이동" },
      { slug: "성황동", name: "성황동" },
      { slug: "중군동", name: "중군동" },
      { slug: "광영동", name: "광영동" },
      { slug: "태인동", name: "태인동" },
      { slug: "금호동", name: "금호동" },
      { slug: "광양읍", name: "광양읍" },
      { slug: "중동", name: "중동" },
      { slug: "진월면", name: "진월면" },
      { slug: "마동", name: "마동" },
      { slug: "다압면", name: "다압면" },
      { slug: "옥곡면", name: "옥곡면" },
      { slug: "옥룡면", name: "옥룡면" }
    ] },
    { slug: "진도군", name: "진도군", nameEn: "", dongs: [
      { slug: "군내면", name: "군내면" },
      { slug: "조도면", name: "조도면" },
      { slug: "지산면", name: "지산면" },
      { slug: "진도군", name: "진도군" },
      { slug: "진도읍", name: "진도읍" },
      { slug: "임회면", name: "임회면" },
      { slug: "의신면", name: "의신면" },
      { slug: "고군면", name: "고군면" }
    ] },
    { slug: "완도군", name: "완도군", nameEn: "", dongs: [
      { slug: "금일읍", name: "금일읍" },
      { slug: "완도군", name: "완도군" },
      { slug: "완도읍", name: "완도읍" },
      { slug: "고금면", name: "고금면" },
      { slug: "군외면", name: "군외면" },
      { slug: "소안면", name: "소안면" },
      { slug: "약산면", name: "약산면" },
      { slug: "신지면", name: "신지면" },
      { slug: "노화읍", name: "노화읍" },
      { slug: "생일면", name: "생일면" },
      { slug: "보길면", name: "보길면" },
      { slug: "청산면", name: "청산면" },
      { slug: "금당면", name: "금당면" }
    ] },
    { slug: "여수시", name: "여수시", nameEn: "", dongs: [
      { slug: "삼산면", name: "삼산면" },
      { slug: "호명동", name: "호명동" },
      { slug: "돌산읍", name: "돌산읍" },
      { slug: "해산동", name: "해산동" },
      { slug: "서교동", name: "서교동" },
      { slug: "봉강동", name: "봉강동" },
      { slug: "봉산동", name: "봉산동" },
      { slug: "남산동", name: "남산동" },
      { slug: "국동", name: "국동" },
      { slug: "신월동", name: "신월동" },
      { slug: "여서동", name: "여서동" },
      { slug: "문수동", name: "문수동" },
      { slug: "군자동", name: "군자동" },
      { slug: "충무동", name: "충무동" },
      { slug: "연등동", name: "연등동" },
      { slug: "광무동", name: "광무동" },
      { slug: "안산동", name: "안산동" },
      { slug: "화양면", name: "화양면" },
      { slug: "남면", name: "남면" },
      { slug: "율촌면", name: "율촌면" },
      { slug: "소호동", name: "소호동" },
      { slug: "시전동", name: "시전동" },
      { slug: "신기동", name: "신기동" },
      { slug: "화정면", name: "화정면" },
      { slug: "오림동", name: "오림동" },
      { slug: "미평동", name: "미평동" },
      { slug: "둔덕동", name: "둔덕동" },
      { slug: "오천동", name: "오천동" },
      { slug: "만흥동", name: "만흥동" },
      { slug: "웅천동", name: "웅천동" },
      { slug: "경호동", name: "경호동" },
      { slug: "학동", name: "학동" },
      { slug: "학용동", name: "학용동" },
      { slug: "중흥동", name: "중흥동" },
      { slug: "적량동", name: "적량동" },
      { slug: "월내동", name: "월내동" },
      { slug: "묘도동", name: "묘도동" },
      { slug: "낙포동", name: "낙포동" },
      { slug: "신덕동", name: "신덕동" },
      { slug: "상암동", name: "상암동" },
      { slug: "소라면", name: "소라면" },
      { slug: "여수시", name: "여수시" },
      { slug: "종화동", name: "종화동" },
      { slug: "수정동", name: "수정동" },
      { slug: "공화동", name: "공화동" },
      { slug: "관문동", name: "관문동" },
      { slug: "고소동", name: "고소동" },
      { slug: "동산동", name: "동산동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "교동", name: "교동" },
      { slug: "화치동", name: "화치동" },
      { slug: "월하동", name: "월하동" },
      { slug: "평여동", name: "평여동" },
      { slug: "여천동", name: "여천동" },
      { slug: "화장동", name: "화장동" },
      { slug: "주삼동", name: "주삼동" },
      { slug: "봉계동", name: "봉계동" },
      { slug: "덕충동", name: "덕충동" },
      { slug: "선원동", name: "선원동" }
    ] },
    { slug: "순천시", name: "순천시", nameEn: "", dongs: [
      { slug: "중앙동", name: "중앙동" },
      { slug: "동외동", name: "동외동" },
      { slug: "남정동", name: "남정동" },
      { slug: "낙안면", name: "낙안면" },
      { slug: "남내동", name: "남내동" },
      { slug: "해룡면", name: "해룡면" },
      { slug: "별량면", name: "별량면" },
      { slug: "대룡동", name: "대룡동" },
      { slug: "홍내동", name: "홍내동" },
      { slug: "오천동", name: "오천동" },
      { slug: "덕월동", name: "덕월동" },
      { slug: "장천동", name: "장천동" },
      { slug: "인제동", name: "인제동" },
      { slug: "저전동", name: "저전동" },
      { slug: "외서면", name: "외서면" },
      { slug: "와룡동", name: "와룡동" },
      { slug: "영동", name: "영동" },
      { slug: "주암면", name: "주암면" },
      { slug: "교량동", name: "교량동" },
      { slug: "월등면", name: "월등면" },
      { slug: "황전면", name: "황전면" },
      { slug: "순천시", name: "순천시" },
      { slug: "삼거동", name: "삼거동" },
      { slug: "야흥동", name: "야흥동" },
      { slug: "인월동", name: "인월동" },
      { slug: "안풍동", name: "안풍동" },
      { slug: "대대동", name: "대대동" },
      { slug: "왕지동", name: "왕지동" },
      { slug: "송광면", name: "송광면" },
      { slug: "조례동", name: "조례동" },
      { slug: "승주읍", name: "승주읍" },
      { slug: "서면", name: "서면" },
      { slug: "상사면", name: "상사면" },
      { slug: "옥천동", name: "옥천동" },
      { slug: "행동", name: "행동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "매곡동", name: "매곡동" },
      { slug: "석현동", name: "석현동" },
      { slug: "가곡동", name: "가곡동" },
      { slug: "용당동", name: "용당동" },
      { slug: "조곡동", name: "조곡동" },
      { slug: "생목동", name: "생목동" },
      { slug: "덕암동", name: "덕암동" },
      { slug: "연향동", name: "연향동" },
      { slug: "풍덕동", name: "풍덕동" }
    ] },
    { slug: "장성군", name: "장성군", nameEn: "", dongs: [
      { slug: "진원면", name: "진원면" },
      { slug: "삼서면", name: "삼서면" },
      { slug: "북일면", name: "북일면" },
      { slug: "장성읍", name: "장성읍" },
      { slug: "서삼면", name: "서삼면" },
      { slug: "황룡면", name: "황룡면" },
      { slug: "북하면", name: "북하면" },
      { slug: "삼계면", name: "삼계면" },
      { slug: "북이면", name: "북이면" },
      { slug: "남면", name: "남면" },
      { slug: "동화면", name: "동화면" },
      { slug: "장성군", name: "장성군" }
    ] },
    { slug: "해남군", name: "해남군", nameEn: "", dongs: [
      { slug: "산이면", name: "산이면" },
      { slug: "해남읍", name: "해남읍" },
      { slug: "북평면", name: "북평면" },
      { slug: "삼산면", name: "삼산면" },
      { slug: "옥천면", name: "옥천면" },
      { slug: "문내면", name: "문내면" },
      { slug: "해남군", name: "해남군" },
      { slug: "현산면", name: "현산면" },
      { slug: "계곡면", name: "계곡면" },
      { slug: "북일면", name: "북일면" },
      { slug: "화산면", name: "화산면" },
      { slug: "황산면", name: "황산면" },
      { slug: "송지면", name: "송지면" },
      { slug: "마산면", name: "마산면" },
      { slug: "화원면", name: "화원면" }
    ] },
    { slug: "담양군", name: "담양군", nameEn: "", dongs: [
      { slug: "봉산면", name: "봉산면" },
      { slug: "고서면", name: "고서면" },
      { slug: "금성면", name: "금성면" },
      { slug: "대덕면", name: "대덕면" },
      { slug: "수북면", name: "수북면" },
      { slug: "용면", name: "용면" },
      { slug: "창평면", name: "창평면" },
      { slug: "담양군", name: "담양군" },
      { slug: "무정면", name: "무정면" },
      { slug: "월산면", name: "월산면" },
      { slug: "대전면", name: "대전면" },
      { slug: "가사문학면", name: "가사문학면" },
      { slug: "담양읍", name: "담양읍" },
      { slug: "남면", name: "남면" }
    ] },
    { slug: "신안군", name: "신안군", nameEn: "", dongs: [
      { slug: "임자면", name: "임자면" },
      { slug: "하의면", name: "하의면" },
      { slug: "도초면", name: "도초면" },
      { slug: "증도면", name: "증도면" },
      { slug: "지도읍", name: "지도읍" },
      { slug: "압해읍", name: "압해읍" },
      { slug: "자은면", name: "자은면" },
      { slug: "암태면", name: "암태면" },
      { slug: "팔금면", name: "팔금면" },
      { slug: "비금면", name: "비금면" },
      { slug: "신의면", name: "신의면" },
      { slug: "장산면", name: "장산면" },
      { slug: "신안군", name: "신안군" },
      { slug: "안좌면", name: "안좌면" },
      { slug: "흑산면", name: "흑산면" }
    ] },
    { slug: "장흥군", name: "장흥군", nameEn: "", dongs: [
      { slug: "대덕읍", name: "대덕읍" },
      { slug: "안양면", name: "안양면" },
      { slug: "장평면", name: "장평면" },
      { slug: "장동면", name: "장동면" },
      { slug: "유치면", name: "유치면" },
      { slug: "용산면", name: "용산면" },
      { slug: "부산면", name: "부산면" },
      { slug: "관산읍", name: "관산읍" },
      { slug: "회진면", name: "회진면" },
      { slug: "장흥군", name: "장흥군" },
      { slug: "장흥읍", name: "장흥읍" }
    ] },
    { slug: "강진군", name: "강진군", nameEn: "", dongs: [
      { slug: "병영면", name: "병영면" },
      { slug: "대구면", name: "대구면" },
      { slug: "옴천면", name: "옴천면" },
      { slug: "마량면", name: "마량면" },
      { slug: "강진군", name: "강진군" },
      { slug: "강진읍", name: "강진읍" },
      { slug: "군동면", name: "군동면" },
      { slug: "도암면", name: "도암면" },
      { slug: "작천면", name: "작천면" },
      { slug: "칠량면", name: "칠량면" },
      { slug: "성전면", name: "성전면" },
      { slug: "신전면", name: "신전면" }
    ] },
    { slug: "함평군", name: "함평군", nameEn: "", dongs: [
      { slug: "손불면", name: "손불면" },
      { slug: "해보면", name: "해보면" },
      { slug: "나산면", name: "나산면" },
      { slug: "월야면", name: "월야면" },
      { slug: "신광면", name: "신광면" },
      { slug: "함평군", name: "함평군" },
      { slug: "함평읍", name: "함평읍" },
      { slug: "학교면", name: "학교면" },
      { slug: "엄다면", name: "엄다면" },
      { slug: "대동면", name: "대동면" }
    ] }
  ],
    districtCount: 22,
    dongCount: 297,
    characteristics: {
      summary: "\uB0A8\uD574\uC548 \uD574\uC591 \uAD00\uAD11\uACFC \uB18D\xB7\uC218\uC0B0\uC5C5\uC774 \uBC1C\uB2EC\uD55C \uCCAD\uC815 \uC790\uC5F0 \uC9C0\uC5ED",
      storeTypes: ["\uD574\uC0B0\uBB3C \uC2DD\uB2F9", "\uAD00\uAD11\uC9C0 \uCE74\uD398", "\uC804\uD1B5 \uC2DC\uC7A5", "\uD39C\uC158\xB7\uBBFC\uBC15"],
      customerBase: ["\uAD00\uAD11\uAC1D", "\uC218\uC0B0\uC5C5\xB7\uB18D\uC5C5 \uC885\uC0AC\uC790", "\uC804\uB0A8 \uB3C4\uBBFC", "\uADC0\uC5B4\xB7\uADC0\uCD0C\uC778"],
      businessHours: "\uAD00\uAD11 \uC131\uC218\uAE30 \uC2EC\uC57C \uC6B4\uC601, \uD3C9\uC2DC \uB2E8\uCD95"
    },
    businessEnvironment: {
      majorIndustries: ["\uD574\uC591 \uAD00\uAD11", "\uC218\uC0B0\uC5C5", "\uB18D\xB7\uCD95\uC0B0\uC5C5", "\uC11D\uC720\uD654\uD559"],
      commercialAreas: ["\uBAA9\uD3EC \uD3C9\uD654\uAD11\uC7A5", "\uC5EC\uC218 \uBC24\uBC14\uB2E4", "\uC21C\uCC9C\uB9CC", "\uAD11\uC591 \uC81C\uCCA0\uC18C \uC8FC\uBCC0"],
      infrastructure: ["\uBAA9\uD3EC\xB7\uC5EC\uC218 \uD56D\uB9CC", "KTX \uBAA9\uD3EC\xB7\uC5EC\uC218", "\uC21C\uCC9C\uB9CC \uC2B5\uC9C0", "\uAD11\uC591\uC81C\uCCA0\uC18C"]
    },
    installationTips: [
      "\uD574\uC548\uAC00 \uBC29\uC218\xB7\uBC29\uCCAD \uAC15\uD654 \uD2B9\uC218 \uC7A5\uBE44",
      "\uAD00\uAD11\uAC1D \uB300\uC0C1 \uB2E4\uAD6D\uC5B4 \uACB0\uC81C \uC2DC\uC2A4\uD15C",
      "\uC218\uC0B0 \uC2DC\uC7A5 \uD65C\uC5B4\xB7\uC0DD\uBB3C \uD310\uB9E4 POS",
      "\uC804\uD1B5 \uC2DC\uC7A5 \uC0C1\uC778 \uAC04\uD3B8 \uACB0\uC81C \uC9C0\uC6D0"
    ],
    featuredDistricts: [
      { name: "\uBAA9\uD3EC\uC2DC", description: "\uC720\uB2EC\uC0B0\xB7\uC0BC\uD559\uB3C4, \uADFC\uB300\uBB38\uD654 \uAD00\uAD11 \uB3C4\uC2DC" },
      { name: "\uC5EC\uC218\uC2DC", description: "\uC5EC\uC218 \uBC24\uBC14\uB2E4\xB7\uD574\uC0C1\uCF00\uC774\uBE14\uCE74, \uC57C\uACBD \uBA85\uC18C" },
      { name: "\uC21C\uCC9C\uC2DC", description: "\uC21C\uCC9C\uB9CC\uAD6D\uAC00\uC815\uC6D0, \uC0DD\uD0DC \uAD00\uAD11 \uC911\uC2EC" },
      { name: "\uAD11\uC591\uC2DC", description: "\uC81C\uCCA0\uC18C\xB7\uC2E0\uB3C4\uC2DC, \uC0B0\uC5C5\uACFC \uC8FC\uAC70 \uACF5\uC874" }
    ]
  },
  // ========================================
  // 경상북도
  // ========================================
  {
    code: "gyeongbuk",
    nameKo: "\uACBD\uC0C1\uBD81\uB3C4",
    nameKoShort: "\uACBD\uBD81",
    nameEn: "Gyeongbuk",
    districts: [
    { slug: "구미시", name: "구미시", nameEn: "", dongs: [
      { slug: "무을면", name: "무을면" },
      { slug: "고아읍", name: "고아읍" },
      { slug: "도개면", name: "도개면" },
      { slug: "해평면", name: "해평면" },
      { slug: "공단동", name: "공단동" },
      { slug: "광평동", name: "광평동" },
      { slug: "사곡동", name: "사곡동" },
      { slug: "상모동", name: "상모동" },
      { slug: "남통동", name: "남통동" },
      { slug: "양호동", name: "양호동" },
      { slug: "거의동", name: "거의동" },
      { slug: "옥계동", name: "옥계동" },
      { slug: "구포동", name: "구포동" },
      { slug: "금전동", name: "금전동" },
      { slug: "선산읍", name: "선산읍" },
      { slug: "옥성면", name: "옥성면" },
      { slug: "원평동", name: "원평동" },
      { slug: "임은동", name: "임은동" },
      { slug: "오태동", name: "오태동" },
      { slug: "구평동", name: "구평동" },
      { slug: "황상동", name: "황상동" },
      { slug: "인의동", name: "인의동" },
      { slug: "진평동", name: "진평동" },
      { slug: "시미동", name: "시미동" },
      { slug: "임수동", name: "임수동" },
      { slug: "지산동", name: "지산동" },
      { slug: "도량동", name: "도량동" },
      { slug: "봉곡동", name: "봉곡동" },
      { slug: "부곡동", name: "부곡동" },
      { slug: "선기동", name: "선기동" },
      { slug: "수점동", name: "수점동" },
      { slug: "신동", name: "신동" },
      { slug: "구미시", name: "구미시" },
      { slug: "산동읍", name: "산동읍" },
      { slug: "장천면", name: "장천면" },
      { slug: "신평동", name: "신평동" },
      { slug: "형곡동", name: "형곡동" },
      { slug: "송정동", name: "송정동" },
      { slug: "비산동", name: "비산동" },
      { slug: "산동면", name: "산동면" }
    ] },
    { slug: "영천시", name: "영천시", nameEn: "", dongs: [
      { slug: "임고면", name: "임고면" },
      { slug: "자양면", name: "자양면" },
      { slug: "신녕면", name: "신녕면" },
      { slug: "화룡동", name: "화룡동" },
      { slug: "작산동", name: "작산동" },
      { slug: "봉동", name: "봉동" },
      { slug: "본촌동", name: "본촌동" },
      { slug: "채신동", name: "채신동" },
      { slug: "괴연동", name: "괴연동" },
      { slug: "대전동", name: "대전동" },
      { slug: "녹전동", name: "녹전동" },
      { slug: "도림동", name: "도림동" },
      { slug: "창구동", name: "창구동" },
      { slug: "영천시", name: "영천시" },
      { slug: "조교동", name: "조교동" },
      { slug: "망정동", name: "망정동" },
      { slug: "대창면", name: "대창면" },
      { slug: "북안면", name: "북안면" },
      { slug: "금호읍", name: "금호읍" },
      { slug: "화북면", name: "화북면" },
      { slug: "문외동", name: "문외동" },
      { slug: "도동", name: "도동" },
      { slug: "화남면", name: "화남면" },
      { slug: "금노동", name: "금노동" },
      { slug: "청통면", name: "청통면" },
      { slug: "완산동", name: "완산동" },
      { slug: "고경면", name: "고경면" },
      { slug: "오미동", name: "오미동" },
      { slug: "오수동", name: "오수동" },
      { slug: "쌍계동", name: "쌍계동" },
      { slug: "도남동", name: "도남동" },
      { slug: "매산동", name: "매산동" },
      { slug: "언하동", name: "언하동" },
      { slug: "신기동", name: "신기동" },
      { slug: "서산동", name: "서산동" },
      { slug: "야사동", name: "야사동" },
      { slug: "문내동", name: "문내동" },
      { slug: "과전동", name: "과전동" },
      { slug: "성내동", name: "성내동" },
      { slug: "범어동", name: "범어동" },
      { slug: "교촌동", name: "교촌동" },
      { slug: "화산면", name: "화산면" }
    ] },
    { slug: "영주시", name: "영주시", nameEn: "", dongs: [
      { slug: "이산면", name: "이산면" },
      { slug: "단산면", name: "단산면" },
      { slug: "안정면", name: "안정면" },
      { slug: "상망동", name: "상망동" },
      { slug: "조와동", name: "조와동" },
      { slug: "조암동", name: "조암동" },
      { slug: "적서동", name: "적서동" },
      { slug: "아지동", name: "아지동" },
      { slug: "창진동", name: "창진동" },
      { slug: "상줄동", name: "상줄동" },
      { slug: "영주동", name: "영주동" },
      { slug: "휴천동", name: "휴천동" },
      { slug: "하망동", name: "하망동" },
      { slug: "문수면", name: "문수면" },
      { slug: "부석면", name: "부석면" },
      { slug: "풍기읍", name: "풍기읍" },
      { slug: "가흥동", name: "가흥동" },
      { slug: "영주시", name: "영주시" },
      { slug: "장수면", name: "장수면" },
      { slug: "평은면", name: "평은면" },
      { slug: "문정동", name: "문정동" },
      { slug: "고현동", name: "고현동" },
      { slug: "봉현면", name: "봉현면" },
      { slug: "순흥면", name: "순흥면" }
    ] },
    { slug: "영덕군", name: "영덕군", nameEn: "", dongs: [
      { slug: "영해면", name: "영해면" },
      { slug: "남정면", name: "남정면" },
      { slug: "병곡면", name: "병곡면" },
      { slug: "축산면", name: "축산면" },
      { slug: "지품면", name: "지품면" },
      { slug: "강구면", name: "강구면" },
      { slug: "영덕군", name: "영덕군" },
      { slug: "창수면", name: "창수면" },
      { slug: "영덕읍", name: "영덕읍" },
      { slug: "달산면", name: "달산면" }
    ] },
    { slug: "경주시", name: "경주시", nameEn: "", dongs: [
      { slug: "덕동", name: "덕동" },
      { slug: "암곡동", name: "암곡동" },
      { slug: "황용동", name: "황용동" },
      { slug: "북군동", name: "북군동" },
      { slug: "손곡동", name: "손곡동" },
      { slug: "율동", name: "율동" },
      { slug: "배동", name: "배동" },
      { slug: "석장동", name: "석장동" },
      { slug: "감포읍", name: "감포읍" },
      { slug: "천북면", name: "천북면" },
      { slug: "안강읍", name: "안강읍" },
      { slug: "강동면", name: "강동면" },
      { slug: "시래동", name: "시래동" },
      { slug: "구정동", name: "구정동" },
      { slug: "경주시", name: "경주시" },
      { slug: "동부동", name: "동부동" },
      { slug: "서부동", name: "서부동" },
      { slug: "북부동", name: "북부동" },
      { slug: "성동동", name: "성동동" },
      { slug: "광명동", name: "광명동" },
      { slug: "동방동", name: "동방동" },
      { slug: "건천읍", name: "건천읍" },
      { slug: "사정동", name: "사정동" },
      { slug: "황남동", name: "황남동" },
      { slug: "교동", name: "교동" },
      { slug: "인왕동", name: "인왕동" },
      { slug: "탑동", name: "탑동" },
      { slug: "산내면", name: "산내면" },
      { slug: "남산동", name: "남산동" },
      { slug: "황오동", name: "황오동" },
      { slug: "노동동", name: "노동동" },
      { slug: "노서동", name: "노서동" },
      { slug: "성건동", name: "성건동" },
      { slug: "마동", name: "마동" },
      { slug: "하동", name: "하동" },
      { slug: "진현동", name: "진현동" },
      { slug: "천군동", name: "천군동" },
      { slug: "신평동", name: "신평동" },
      { slug: "문무대왕면", name: "문무대왕면" },
      { slug: "충효동", name: "충효동" },
      { slug: "서악동", name: "서악동" },
      { slug: "효현동", name: "효현동" },
      { slug: "외동읍", name: "외동읍" },
      { slug: "도지동", name: "도지동" },
      { slug: "배반동", name: "배반동" },
      { slug: "구황동", name: "구황동" },
      { slug: "보문동", name: "보문동" },
      { slug: "황성동", name: "황성동" },
      { slug: "용강동", name: "용강동" },
      { slug: "동천동", name: "동천동" },
      { slug: "평동", name: "평동" },
      { slug: "조양동", name: "조양동" },
      { slug: "시동", name: "시동" },
      { slug: "현곡면", name: "현곡면" },
      { slug: "내남면", name: "내남면" },
      { slug: "서면", name: "서면" },
      { slug: "양남면", name: "양남면" },
      { slug: "양북면", name: "양북면" }
    ] },
    { slug: "김천시", name: "김천시", nameEn: "", dongs: [
      { slug: "조마면", name: "조마면" },
      { slug: "문당동", name: "문당동" },
      { slug: "다수동", name: "다수동" },
      { slug: "백옥동", name: "백옥동" },
      { slug: "부곡동", name: "부곡동" },
      { slug: "봉산면", name: "봉산면" },
      { slug: "남면", name: "남면" },
      { slug: "감문면", name: "감문면" },
      { slug: "부항면", name: "부항면" },
      { slug: "개령면", name: "개령면" },
      { slug: "어모면", name: "어모면" },
      { slug: "김천시", name: "김천시" },
      { slug: "감호동", name: "감호동" },
      { slug: "용두동", name: "용두동" },
      { slug: "모암동", name: "모암동" },
      { slug: "성내동", name: "성내동" },
      { slug: "평화동", name: "평화동" },
      { slug: "남산동", name: "남산동" },
      { slug: "황금동", name: "황금동" },
      { slug: "지례면", name: "지례면" },
      { slug: "신음동", name: "신음동" },
      { slug: "교동", name: "교동" },
      { slug: "삼락동", name: "삼락동" },
      { slug: "아포읍", name: "아포읍" },
      { slug: "농소면", name: "농소면" },
      { slug: "증산면", name: "증산면" },
      { slug: "양천동", name: "양천동" },
      { slug: "율곡동", name: "율곡동" },
      { slug: "구성면", name: "구성면" },
      { slug: "대항면", name: "대항면" },
      { slug: "감천면", name: "감천면" },
      { slug: "대덕면", name: "대덕면" },
      { slug: "지좌동", name: "지좌동" },
      { slug: "덕곡동", name: "덕곡동" },
      { slug: "대광동", name: "대광동" },
      { slug: "응명동", name: "응명동" }
    ] },
    { slug: "상주시", name: "상주시", nameEn: "", dongs: [
      { slug: "외남면", name: "외남면" },
      { slug: "외답동", name: "외답동" },
      { slug: "공검면", name: "공검면" },
      { slug: "중동면", name: "중동면" },
      { slug: "화동면", name: "화동면" },
      { slug: "개운동", name: "개운동" },
      { slug: "신봉동", name: "신봉동" },
      { slug: "가장동", name: "가장동" },
      { slug: "은척면", name: "은척면" },
      { slug: "내서면", name: "내서면" },
      { slug: "죽전동", name: "죽전동" },
      { slug: "만산동", name: "만산동" },
      { slug: "연원동", name: "연원동" },
      { slug: "남장동", name: "남장동" },
      { slug: "남적동", name: "남적동" },
      { slug: "함창읍", name: "함창읍" },
      { slug: "화개동", name: "화개동" },
      { slug: "청리면", name: "청리면" },
      { slug: "낙양동", name: "낙양동" },
      { slug: "화북면", name: "화북면" },
      { slug: "외서면", name: "외서면" },
      { slug: "화서면", name: "화서면" },
      { slug: "모동면", name: "모동면" },
      { slug: "양촌동", name: "양촌동" },
      { slug: "낙동면", name: "낙동면" },
      { slug: "지천동", name: "지천동" },
      { slug: "이안면", name: "이안면" },
      { slug: "오대동", name: "오대동" },
      { slug: "흥각동", name: "흥각동" },
      { slug: "거동동", name: "거동동" },
      { slug: "인평동", name: "인평동" },
      { slug: "서곡동", name: "서곡동" },
      { slug: "헌신동", name: "헌신동" },
      { slug: "병성동", name: "병성동" },
      { slug: "도남동", name: "도남동" },
      { slug: "낙상동", name: "낙상동" },
      { slug: "중덕동", name: "중덕동" },
      { slug: "화남면", name: "화남면" },
      { slug: "상주시", name: "상주시" },
      { slug: "성하동", name: "성하동" },
      { slug: "성동동", name: "성동동" },
      { slug: "인봉동", name: "인봉동" },
      { slug: "사벌국면", name: "사벌국면" },
      { slug: "복룡동", name: "복룡동" },
      { slug: "냉림동", name: "냉림동" },
      { slug: "서성동", name: "서성동" },
      { slug: "공성면", name: "공성면" },
      { slug: "모서면", name: "모서면" },
      { slug: "남성동", name: "남성동" },
      { slug: "서문동", name: "서문동" },
      { slug: "무양동", name: "무양동" },
      { slug: "초산동", name: "초산동" },
      { slug: "화산동", name: "화산동" },
      { slug: "계산동", name: "계산동" },
      { slug: "부원동", name: "부원동" },
      { slug: "사벌면", name: "사벌면" }
    ] },
    { slug: "봉화군", name: "봉화군", nameEn: "", dongs: [
      { slug: "명호면", name: "명호면" },
      { slug: "봉성면", name: "봉성면" },
      { slug: "춘양면", name: "춘양면" },
      { slug: "소천면", name: "소천면" },
      { slug: "석포면", name: "석포면" },
      { slug: "봉화군", name: "봉화군" },
      { slug: "법전면", name: "법전면" },
      { slug: "상운면", name: "상운면" },
      { slug: "재산면", name: "재산면" },
      { slug: "봉화읍", name: "봉화읍" },
      { slug: "물야면", name: "물야면" }
    ] },
    { slug: "고령군", name: "고령군", nameEn: "", dongs: [
      { slug: "개진면", name: "개진면" },
      { slug: "우곡면", name: "우곡면" },
      { slug: "쌍림면", name: "쌍림면" },
      { slug: "다산면", name: "다산면" },
      { slug: "덕곡면", name: "덕곡면" },
      { slug: "운수면", name: "운수면" },
      { slug: "고령군", name: "고령군" },
      { slug: "대가야읍", name: "대가야읍" },
      { slug: "성산면", name: "성산면" },
      { slug: "고령읍", name: "고령읍" }
    ] },
    { slug: "포항시 북구", name: "포항시 북구", nameEn: "", dongs: [
      { slug: "흥해읍", name: "흥해읍" },
      { slug: "대신동", name: "대신동" },
      { slug: "동빈1가", name: "동빈1가" },
      { slug: "동빈2가", name: "동빈2가" },
      { slug: "학산동", name: "학산동" },
      { slug: "항구동", name: "항구동" },
      { slug: "득량동", name: "득량동" },
      { slug: "죽장면", name: "죽장면" },
      { slug: "청하면", name: "청하면" },
      { slug: "포항시북구", name: "포항시북구" },
      { slug: "대흥동", name: "대흥동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "남빈동", name: "남빈동" },
      { slug: "상원동", name: "상원동" },
      { slug: "여천동", name: "여천동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "덕산동", name: "덕산동" },
      { slug: "장성동", name: "장성동" },
      { slug: "양덕동", name: "양덕동" },
      { slug: "환호동", name: "환호동" },
      { slug: "여남동", name: "여남동" },
      { slug: "기북면", name: "기북면" },
      { slug: "용흥동", name: "용흥동" },
      { slug: "우현동", name: "우현동" },
      { slug: "창포동", name: "창포동" },
      { slug: "두호동", name: "두호동" },
      { slug: "덕수동", name: "덕수동" },
      { slug: "기계면", name: "기계면" },
      { slug: "학잠동", name: "학잠동" },
      { slug: "죽도동", name: "죽도동" },
      { slug: "신광면", name: "신광면" },
      { slug: "송라면", name: "송라면" }
    ] },
    { slug: "포항시남구", name: "포항시남구", nameEn: "", dongs: [
      { slug: "대송면", name: "대송면" },
      { slug: "동해면", name: "동해면" },
      { slug: "연일읍", name: "연일읍" },
      { slug: "호미곶면", name: "호미곶면" },
      { slug: "송내동", name: "송내동" },
      { slug: "괴동동", name: "괴동동" },
      { slug: "동촌동", name: "동촌동" },
      { slug: "장흥동", name: "장흥동" },
      { slug: "인덕동", name: "인덕동" },
      { slug: "호동", name: "호동" },
      { slug: "효자동", name: "효자동" },
      { slug: "지곡동", name: "지곡동" },
      { slug: "대잠동", name: "대잠동" },
      { slug: "이동", name: "이동" },
      { slug: "구룡포읍", name: "구룡포읍" },
      { slug: "일월동", name: "일월동" },
      { slug: "송정동", name: "송정동" },
      { slug: "오천읍", name: "오천읍" },
      { slug: "포항시남구", name: "포항시남구" },
      { slug: "상도동", name: "상도동" },
      { slug: "대도동", name: "대도동" },
      { slug: "해도동", name: "해도동" },
      { slug: "송도동", name: "송도동" },
      { slug: "청림동", name: "청림동" },
      { slug: "장기면", name: "장기면" }
    ] },
    { slug: "청도군", name: "청도군", nameEn: "", dongs: [
      { slug: "청도읍", name: "청도읍" },
      { slug: "각북면", name: "각북면" },
      { slug: "각남면", name: "각남면" },
      { slug: "매전면", name: "매전면" },
      { slug: "운문면", name: "운문면" },
      { slug: "청도군", name: "청도군" },
      { slug: "화양읍", name: "화양읍" },
      { slug: "풍각면", name: "풍각면" },
      { slug: "이서면", name: "이서면" },
      { slug: "금천면", name: "금천면" }
    ] },
    { slug: "영양군", name: "영양군", nameEn: "", dongs: [
      { slug: "청기면", name: "청기면" },
      { slug: "수비면", name: "수비면" },
      { slug: "영양군", name: "영양군" },
      { slug: "영양읍", name: "영양읍" },
      { slug: "일월면", name: "일월면" },
      { slug: "석보면", name: "석보면" },
      { slug: "입암면", name: "입암면" }
    ] },
    { slug: "문경시", name: "문경시", nameEn: "", dongs: [
      { slug: "산북면", name: "산북면" },
      { slug: "문경시", name: "문경시" },
      { slug: "동로면", name: "동로면" },
      { slug: "가은읍", name: "가은읍" },
      { slug: "영순면", name: "영순면" },
      { slug: "우지동", name: "우지동" },
      { slug: "창동", name: "창동" },
      { slug: "모전동", name: "모전동" },
      { slug: "윤직동", name: "윤직동" },
      { slug: "문경읍", name: "문경읍" },
      { slug: "농암면", name: "농암면" },
      { slug: "공평동", name: "공평동" },
      { slug: "점촌동", name: "점촌동" },
      { slug: "영신동", name: "영신동" },
      { slug: "마성면", name: "마성면" },
      { slug: "산양면", name: "산양면" },
      { slug: "흥덕동", name: "흥덕동" },
      { slug: "호계면", name: "호계면" },
      { slug: "신기동", name: "신기동" },
      { slug: "불정동", name: "불정동" },
      { slug: "유곡동", name: "유곡동" }
    ] },
    { slug: "성주군", name: "성주군", nameEn: "", dongs: [
      { slug: "벽진면", name: "벽진면" },
      { slug: "가천면", name: "가천면" },
      { slug: "월항면", name: "월항면" },
      { slug: "선남면", name: "선남면" },
      { slug: "용암면", name: "용암면" },
      { slug: "초전면", name: "초전면" },
      { slug: "대가면", name: "대가면" },
      { slug: "금수강산면", name: "금수강산면" },
      { slug: "성주읍", name: "성주읍" },
      { slug: "수륜면", name: "수륜면" },
      { slug: "성주군", name: "성주군" },
      { slug: "금수면", name: "금수면" }
    ] },
    { slug: "안동시", name: "안동시", nameEn: "", dongs: [
      { slug: "이천동", name: "이천동" },
      { slug: "동문동", name: "동문동" },
      { slug: "동부동", name: "동부동" },
      { slug: "운흥동", name: "운흥동" },
      { slug: "천리동", name: "천리동" },
      { slug: "남부동", name: "남부동" },
      { slug: "남문동", name: "남문동" },
      { slug: "안흥동", name: "안흥동" },
      { slug: "대석동", name: "대석동" },
      { slug: "옥야동", name: "옥야동" },
      { slug: "광석동", name: "광석동" },
      { slug: "당북동", name: "당북동" },
      { slug: "와룡면", name: "와룡면" },
      { slug: "풍천면", name: "풍천면" },
      { slug: "옥정동", name: "옥정동" },
      { slug: "신세동", name: "신세동" },
      { slug: "남후면", name: "남후면" },
      { slug: "상아동", name: "상아동" },
      { slug: "안막동", name: "안막동" },
      { slug: "임동면", name: "임동면" },
      { slug: "북후면", name: "북후면" },
      { slug: "운안동", name: "운안동" },
      { slug: "성곡동", name: "성곡동" },
      { slug: "태화동", name: "태화동" },
      { slug: "옥동", name: "옥동" },
      { slug: "서후면", name: "서후면" },
      { slug: "화성동", name: "화성동" },
      { slug: "목성동", name: "목성동" },
      { slug: "안동시", name: "안동시" },
      { slug: "삼산동", name: "삼산동" },
      { slug: "서부동", name: "서부동" },
      { slug: "북문동", name: "북문동" },
      { slug: "명륜동", name: "명륜동" },
      { slug: "신안동", name: "신안동" },
      { slug: "율세동", name: "율세동" },
      { slug: "노하동", name: "노하동" },
      { slug: "송현동", name: "송현동" },
      { slug: "송천동", name: "송천동" },
      { slug: "석동동", name: "석동동" },
      { slug: "수하동", name: "수하동" },
      { slug: "풍산읍", name: "풍산읍" },
      { slug: "정상동", name: "정상동" },
      { slug: "정하동", name: "정하동" },
      { slug: "수상동", name: "수상동" },
      { slug: "임하면", name: "임하면" },
      { slug: "녹전면", name: "녹전면" },
      { slug: "안기동", name: "안기동" },
      { slug: "일직면", name: "일직면" },
      { slug: "길안면", name: "길안면" },
      { slug: "법흥동", name: "법흥동" },
      { slug: "용상동", name: "용상동" },
      { slug: "금곡동", name: "금곡동" },
      { slug: "평화동", name: "평화동" },
      { slug: "법상동", name: "법상동" },
      { slug: "남선면", name: "남선면" },
      { slug: "도산면", name: "도산면" },
      { slug: "예안면", name: "예안면" }
    ] },
    { slug: "경산시", name: "경산시", nameEn: "", dongs: [
      { slug: "신교동", name: "신교동" },
      { slug: "상방동", name: "상방동" },
      { slug: "대동", name: "대동" },
      { slug: "계양동", name: "계양동" },
      { slug: "경산시", name: "경산시" },
      { slug: "삼남동", name: "삼남동" },
      { slug: "삼북동", name: "삼북동" },
      { slug: "서상동", name: "서상동" },
      { slug: "백천동", name: "백천동" },
      { slug: "남방동", name: "남방동" },
      { slug: "남천면", name: "남천면" },
      { slug: "남산면", name: "남산면" },
      { slug: "조영동", name: "조영동" },
      { slug: "내동", name: "내동" },
      { slug: "여천동", name: "여천동" },
      { slug: "유곡동", name: "유곡동" },
      { slug: "신천동", name: "신천동" },
      { slug: "점촌동", name: "점촌동" },
      { slug: "평산동", name: "평산동" },
      { slug: "사동", name: "사동" },
      { slug: "와촌면", name: "와촌면" },
      { slug: "평사리(坪沙)", name: "평사리(坪沙)" },
      { slug: "평사리(平沙)", name: "평사리(平沙)" },
      { slug: "자인면", name: "자인면" },
      { slug: "옥곡동", name: "옥곡동" },
      { slug: "사정동", name: "사정동" },
      { slug: "옥산동", name: "옥산동" },
      { slug: "중산동", name: "중산동" },
      { slug: "정평동", name: "정평동" },
      { slug: "삼풍동", name: "삼풍동" },
      { slug: "갑제동", name: "갑제동" },
      { slug: "하양읍", name: "하양읍" },
      { slug: "진량읍", name: "진량읍" },
      { slug: "대평동", name: "대평동" },
      { slug: "대정동", name: "대정동" },
      { slug: "임당동", name: "임당동" },
      { slug: "중방동", name: "중방동" },
      { slug: "압량읍", name: "압량읍" },
      { slug: "용성면", name: "용성면" },
      { slug: "압량면", name: "압량면" }
    ] },
    { slug: "의성군", name: "의성군", nameEn: "", dongs: [
      { slug: "의성읍", name: "의성읍" },
      { slug: "봉양면", name: "봉양면" },
      { slug: "신평면", name: "신평면" },
      { slug: "안계면", name: "안계면" },
      { slug: "구천면", name: "구천면" },
      { slug: "안사면", name: "안사면" },
      { slug: "단북면", name: "단북면" },
      { slug: "사곡면", name: "사곡면" },
      { slug: "단밀면", name: "단밀면" },
      { slug: "금성면", name: "금성면" },
      { slug: "옥산면", name: "옥산면" },
      { slug: "가음면", name: "가음면" },
      { slug: "춘산면", name: "춘산면" },
      { slug: "단촌면", name: "단촌면" },
      { slug: "다인면", name: "다인면" },
      { slug: "점곡면", name: "점곡면" },
      { slug: "의성군", name: "의성군" },
      { slug: "안평면", name: "안평면" },
      { slug: "비안면", name: "비안면" }
    ] },
    { slug: "예천군", name: "예천군", nameEn: "", dongs: [
      { slug: "예천군", name: "예천군" },
      { slug: "예천읍", name: "예천읍" },
      { slug: "보문면", name: "보문면" },
      { slug: "용문면", name: "용문면" },
      { slug: "지보면", name: "지보면" },
      { slug: "풍양면", name: "풍양면" },
      { slug: "유천면", name: "유천면" },
      { slug: "개포면", name: "개포면" },
      { slug: "호명읍", name: "호명읍" },
      { slug: "은풍면", name: "은풍면" },
      { slug: "용궁면", name: "용궁면" },
      { slug: "감천면", name: "감천면" },
      { slug: "효자면", name: "효자면" },
      { slug: "호명면", name: "호명면" },
      { slug: "상리면", name: "상리면" },
      { slug: "하리면", name: "하리면" }
    ] },
    { slug: "울진군", name: "울진군", nameEn: "", dongs: [
      { slug: "매화면", name: "매화면" },
      { slug: "기성면", name: "기성면" },
      { slug: "평해읍", name: "평해읍" },
      { slug: "울진군", name: "울진군" },
      { slug: "울진읍", name: "울진읍" },
      { slug: "근남면", name: "근남면" },
      { slug: "후포면", name: "후포면" },
      { slug: "금강송면", name: "금강송면" },
      { slug: "북면", name: "북면" },
      { slug: "온정면", name: "온정면" },
      { slug: "죽변면", name: "죽변면" },
      { slug: "서면", name: "서면" },
      { slug: "원남면", name: "원남면" }
    ] },
    { slug: "청송군", name: "청송군", nameEn: "", dongs: [
      { slug: "현동면", name: "현동면" },
      { slug: "파천면", name: "파천면" },
      { slug: "진보면", name: "진보면" },
      { slug: "주왕산면", name: "주왕산면" },
      { slug: "안덕면", name: "안덕면" },
      { slug: "청송읍", name: "청송읍" },
      { slug: "청송군", name: "청송군" },
      { slug: "현서면", name: "현서면" },
      { slug: "부남면", name: "부남면" },
      { slug: "부동면", name: "부동면" }
    ] },
    { slug: "칠곡군", name: "칠곡군", nameEn: "", dongs: [
      { slug: "석적읍", name: "석적읍" },
      { slug: "약목면", name: "약목면" },
      { slug: "북삼읍", name: "북삼읍" },
      { slug: "동명면", name: "동명면" },
      { slug: "기산면", name: "기산면" },
      { slug: "지천면", name: "지천면" },
      { slug: "왜관읍", name: "왜관읍" },
      { slug: "칠곡군", name: "칠곡군" },
      { slug: "가산면", name: "가산면" }
    ] },
    { slug: "포항시", name: "포항시", nameEn: "", dongs: [
      { slug: "포항시", name: "포항시" }
    ] },
    { slug: "울릉군", name: "울릉군", nameEn: "", dongs: [
      { slug: "울릉군", name: "울릉군" },
      { slug: "울릉읍", name: "울릉읍" },
      { slug: "서면", name: "서면" },
      { slug: "북면", name: "북면" }
    ] },
    { slug: "군위군", name: "군위군", nameEn: "", dongs: [
      { slug: "효령면", name: "효령면" },
      { slug: "군위군", name: "군위군" },
      { slug: "군위읍", name: "군위읍" },
      { slug: "의흥면", name: "의흥면" },
      { slug: "우보면", name: "우보면" },
      { slug: "산성면", name: "산성면" },
      { slug: "삼국유사면", name: "삼국유사면" },
      { slug: "부계면", name: "부계면" },
      { slug: "소보면", name: "소보면" },
      { slug: "고로면", name: "고로면" }
    ] },
    { slug: "포항시 남구", name: "포항시 남구", nameEn: "", dongs: [
      { slug: "호미곶면", name: "호미곶면" },
      { slug: "상도동", name: "상도동" },
      { slug: "대도동", name: "대도동" },
      { slug: "해도동", name: "해도동" },
      { slug: "송도동", name: "송도동" },
      { slug: "청림동", name: "청림동" },
      { slug: "일월동", name: "일월동" },
      { slug: "송정동", name: "송정동" },
      { slug: "송내동", name: "송내동" },
      { slug: "괴동동", name: "괴동동" },
      { slug: "동촌동", name: "동촌동" },
      { slug: "장흥동", name: "장흥동" },
      { slug: "인덕동", name: "인덕동" },
      { slug: "호동", name: "호동" },
      { slug: "효자동", name: "효자동" },
      { slug: "지곡동", name: "지곡동" },
      { slug: "대잠동", name: "대잠동" },
      { slug: "이동", name: "이동" },
      { slug: "장기면", name: "장기면" },
      { slug: "포항시남구", name: "포항시남구" },
      { slug: "구룡포읍", name: "구룡포읍" },
      { slug: "연일읍", name: "연일읍" },
      { slug: "오천읍", name: "오천읍" },
      { slug: "대송면", name: "대송면" },
      { slug: "동해면", name: "동해면" }
    ] }
  ],
    districtCount: 22,
    dongCount: 332,
    characteristics: {
      summary: "\uC2E0\uB77C \uCC9C\uB144 \uACE0\uB3C4\uC640 \uCCA0\uAC15\xB7\uC804\uC790 \uC0B0\uC5C5\uC774 \uACF5\uC874\uD558\uB294 \uC5ED\uC0AC\xB7\uC0B0\uC5C5 \uC9C0\uC5ED",
      storeTypes: ["\uC5ED\uC0AC \uAD00\uAD11\uC9C0 \uCE74\uD398", "\uACF5\uB2E8 \uC2DD\uB2F9", "\uC804\uD1B5 \uD55C\uC625 \uBBFC\uBC15", "\uB300\uD559\uAC00 \uB9E4\uC7A5"],
      customerBase: ["\uAD6D\uB0B4\uC678 \uAD00\uAD11\uAC1D", "\uD3EC\uC2A4\uCF54\xB7LG \uADFC\uB85C\uC790", "\uB300\uD559\uC0DD", "\uACBD\uBD81 \uB3C4\uBBFC"],
      businessHours: "\uC8FC\uB9D0 \uAD00\uAD11\uAC1D \uC9D1\uC911, \uD3C9\uC77C \uACF5\uB2E8 \uADFC\uB85C\uC790 \uC810\uC2EC \uC218\uC694"
    },
    businessEnvironment: {
      majorIndustries: ["\uCCA0\uAC15\xB7\uC804\uC790", "\uC790\uB3D9\uCC28\xB7\uBD80\uD488", "\uAD00\uAD11\xB7\uBB38\uD654\uC720\uC0B0", "\uB18D\uC5C5"],
      commercialAreas: ["\uACBD\uC8FC \uBCF4\uBB38\uAD00\uAD11\uB2E8\uC9C0", "\uD3EC\uD56D \uAD6C\uB8E1\uD3EC\xB7\uC601\uC77C\uB300", "\uAD6C\uBBF8 \uACF5\uB2E8\uB3D9", "\uC548\uB3D9 \uD558\uD68C\uB9C8\uC744"],
      infrastructure: ["KTX \uACBD\uC8FC\uC5ED", "\uD3EC\uC2A4\uCF54\xB7LG\uC804\uC790", "\uACBD\uC8FC \uC720\uB124\uC2A4\uCF54 \uC720\uC801", "\uC548\uB3D9 \uC720\uAD50\uBB38\uD654"]
    },
    installationTips: [
      "\uC720\uB124\uC2A4\uCF54 \uBB38\uD654\uC720\uC0B0 \uC9C0\uC5ED \uC678\uAD6D\uC5B4 \uC9C0\uC6D0",
      "\uACF5\uB2E8 \uADFC\uB85C\uC790 \uB300\uC0C1 \uC57C\uAC04\xB7\uBC95\uC778 \uACB0\uC81C",
      "\uD558\uD68C\uB9C8\uC744\xB7\uC591\uB3D9\uB9C8\uC744 \uC804\uD1B5 \uB9E4\uC7A5 \uC194\uB8E8\uC158",
      "\uD574\uC548\uAC00 \uD3EC\uD56D \uC218\uC0B0\uBB3C \uC2DC\uC7A5 \uBC29\uC218 \uC7A5\uBE44"
    ],
    featuredDistricts: [
      { name: "\uACBD\uC8FC\uC2DC", description: "\uC2E0\uB77C \uBB38\uD654\uC720\uC0B0, \uBD88\uAD6D\uC0AC\xB7\uC11D\uAD74\uC554 \uAD00\uAD11" },
      { name: "\uD3EC\uD56D\uC2DC", description: "\uD3EC\uC2A4\uCF54\xB7\uC601\uC77C\uB300 \uD574\uC218\uC695\uC7A5 \uBCF5\uD569 \uC0C1\uAD8C" },
      { name: "\uAD6C\uBBF8\uC2DC", description: "\uC804\uC790 \uACF5\uB2E8, \uB300\uAE30\uC5C5 \uC9C1\uC6D0 \uC0C1\uAD8C" },
      { name: "\uC548\uB3D9\uC2DC", description: "\uD558\uD68C\uB9C8\uC744\xB7\uC720\uAD50\uBB38\uD654, \uC804\uD1B5 \uAD00\uAD11\uC9C0" }
    ]
  },
  // ========================================
  // 경상남도
  // ========================================
  {
    code: "gyeongnam",
    nameKo: "\uACBD\uC0C1\uB0A8\uB3C4",
    nameKoShort: "\uACBD\uB0A8",
    nameEn: "Gyeongnam",
    districts: [
    { slug: "거창군", name: "거창군", nameEn: "", dongs: [
      { slug: "거창읍", name: "거창읍" },
      { slug: "가조면", name: "가조면" },
      { slug: "신원면", name: "신원면" },
      { slug: "마리면", name: "마리면" },
      { slug: "남상면", name: "남상면" },
      { slug: "웅양면", name: "웅양면" },
      { slug: "가북면", name: "가북면" },
      { slug: "거창군", name: "거창군" },
      { slug: "주상면", name: "주상면" },
      { slug: "위천면", name: "위천면" },
      { slug: "남하면", name: "남하면" },
      { slug: "고제면", name: "고제면" },
      { slug: "북상면", name: "북상면" }
    ] },
    { slug: "거제시", name: "거제시", nameEn: "", dongs: [
      { slug: "사등면", name: "사등면" },
      { slug: "연초면", name: "연초면" },
      { slug: "삼거동", name: "삼거동" },
      { slug: "수월동", name: "수월동" },
      { slug: "일운면", name: "일운면" },
      { slug: "둔덕면", name: "둔덕면" },
      { slug: "거제시", name: "거제시" },
      { slug: "하청면", name: "하청면" },
      { slug: "능포동", name: "능포동" },
      { slug: "동부면", name: "동부면" },
      { slug: "양정동", name: "양정동" },
      { slug: "장목면", name: "장목면" },
      { slug: "장승포동", name: "장승포동" },
      { slug: "두모동", name: "두모동" },
      { slug: "아양동", name: "아양동" },
      { slug: "아주동", name: "아주동" },
      { slug: "옥포동", name: "옥포동" },
      { slug: "덕포동", name: "덕포동" },
      { slug: "장평동", name: "장평동" },
      { slug: "고현동", name: "고현동" },
      { slug: "상동동", name: "상동동" },
      { slug: "문동동", name: "문동동" },
      { slug: "남부면", name: "남부면" },
      { slug: "거제면", name: "거제면" }
    ] },
    { slug: "의령군", name: "의령군", nameEn: "", dongs: [
      { slug: "화정면", name: "화정면" },
      { slug: "용덕면", name: "용덕면" },
      { slug: "낙서면", name: "낙서면" },
      { slug: "유곡면", name: "유곡면" },
      { slug: "의령군", name: "의령군" },
      { slug: "의령읍", name: "의령읍" },
      { slug: "칠곡면", name: "칠곡면" },
      { slug: "봉수면", name: "봉수면" },
      { slug: "지정면", name: "지정면" },
      { slug: "부림면", name: "부림면" },
      { slug: "대의면", name: "대의면" },
      { slug: "궁류면", name: "궁류면" },
      { slug: "가례면", name: "가례면" },
      { slug: "정곡면", name: "정곡면" }
    ] },
    { slug: "창원시 진해구", name: "창원시 진해구", nameEn: "", dongs: [
      { slug: "회현동", name: "회현동" },
      { slug: "익선동", name: "익선동" },
      { slug: "서중동", name: "서중동" },
      { slug: "죽곡동", name: "죽곡동" },
      { slug: "수송동", name: "수송동" },
      { slug: "안곡동", name: "안곡동" },
      { slug: "성내동", name: "성내동" },
      { slug: "비봉동", name: "비봉동" },
      { slug: "풍호동", name: "풍호동" },
      { slug: "장천동", name: "장천동" },
      { slug: "명동", name: "명동" },
      { slug: "숭인동", name: "숭인동" },
      { slug: "대영동", name: "대영동" },
      { slug: "남빈동", name: "남빈동" },
      { slug: "행암동", name: "행암동" },
      { slug: "앵곡동", name: "앵곡동" },
      { slug: "자은동", name: "자은동" },
      { slug: "속천동", name: "속천동" },
      { slug: "대죽동", name: "대죽동" },
      { slug: "원포동", name: "원포동" },
      { slug: "남양동", name: "남양동" },
      { slug: "마천동", name: "마천동" },
      { slug: "소사동", name: "소사동" },
      { slug: "대장동", name: "대장동" },
      { slug: "통신동", name: "통신동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "북부동", name: "북부동" },
      { slug: "석동", name: "석동" },
      { slug: "수도동", name: "수도동" },
      { slug: "연도동", name: "연도동" },
      { slug: "덕산동", name: "덕산동" },
      { slug: "송학동", name: "송학동" },
      { slug: "대흥동", name: "대흥동" },
      { slug: "평안동", name: "평안동" },
      { slug: "충무동", name: "충무동" },
      { slug: "인사동", name: "인사동" },
      { slug: "여좌동", name: "여좌동" },
      { slug: "태백동", name: "태백동" },
      { slug: "경화동", name: "경화동" },
      { slug: "제덕동", name: "제덕동" },
      { slug: "태평동", name: "태평동" },
      { slug: "남문동", name: "남문동" },
      { slug: "대천동", name: "대천동" },
      { slug: "광화동", name: "광화동" },
      { slug: "중평동", name: "중평동" },
      { slug: "근화동", name: "근화동" },
      { slug: "송죽동", name: "송죽동" },
      { slug: "화천동", name: "화천동" },
      { slug: "창원시 진해구", name: "창원시 진해구" },
      { slug: "동상동", name: "동상동" },
      { slug: "도천동", name: "도천동" },
      { slug: "창선동", name: "창선동" },
      { slug: "부흥동", name: "부흥동" },
      { slug: "두동", name: "두동" },
      { slug: "청안동", name: "청안동" },
      { slug: "안골동", name: "안골동" },
      { slug: "용원동", name: "용원동" },
      { slug: "가주동", name: "가주동" },
      { slug: "이동", name: "이동" },
      { slug: "무송동", name: "무송동" },
      { slug: "인의동", name: "인의동" },
      { slug: "도만동", name: "도만동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "현동", name: "현동" },
      { slug: "충의동", name: "충의동" },
      { slug: "제황산동", name: "제황산동" },
      { slug: "창원시진해구", name: "창원시진해구" }
    ] },
    { slug: "산청군", name: "산청군", nameEn: "", dongs: [
      { slug: "시천면", name: "시천면" },
      { slug: "산청군", name: "산청군" },
      { slug: "산청읍", name: "산청읍" },
      { slug: "단성면", name: "단성면" },
      { slug: "차황면", name: "차황면" },
      { slug: "생비량면", name: "생비량면" },
      { slug: "신등면", name: "신등면" },
      { slug: "생초면", name: "생초면" },
      { slug: "오부면", name: "오부면" },
      { slug: "삼장면", name: "삼장면" },
      { slug: "금서면", name: "금서면" },
      { slug: "신안면", name: "신안면" }
    ] },
    { slug: "합천군", name: "합천군", nameEn: "", dongs: [
      { slug: "용주면", name: "용주면" },
      { slug: "야로면", name: "야로면" },
      { slug: "율곡면", name: "율곡면" },
      { slug: "쌍책면", name: "쌍책면" },
      { slug: "대병면", name: "대병면" },
      { slug: "초계면", name: "초계면" },
      { slug: "덕곡면", name: "덕곡면" },
      { slug: "대양면", name: "대양면" },
      { slug: "가야면", name: "가야면" },
      { slug: "묘산면", name: "묘산면" },
      { slug: "쌍백면", name: "쌍백면" },
      { slug: "적중면", name: "적중면" },
      { slug: "합천군", name: "합천군" },
      { slug: "합천읍", name: "합천읍" },
      { slug: "봉산면", name: "봉산면" },
      { slug: "삼가면", name: "삼가면" },
      { slug: "청덕면", name: "청덕면" },
      { slug: "가회면", name: "가회면" }
    ] },
    { slug: "창원시마산합포구", name: "창원시마산합포구", nameEn: "", dongs: [
      { slug: "오동동", name: "오동동" },
      { slug: "덕동동", name: "덕동동" },
      { slug: "동성동", name: "동성동" },
      { slug: "두월동1가", name: "두월동1가" },
      { slug: "두월동2가", name: "두월동2가" },
      { slug: "두월동3가", name: "두월동3가" },
      { slug: "창포동2가", name: "창포동2가" },
      { slug: "창포동3가", name: "창포동3가" },
      { slug: "청계동", name: "청계동" },
      { slug: "추산동", name: "추산동" },
      { slug: "신포동1가", name: "신포동1가" },
      { slug: "월남동5가", name: "월남동5가" },
      { slug: "장군동3가", name: "장군동3가" },
      { slug: "장군동4가", name: "장군동4가" },
      { slug: "우산동", name: "우산동" },
      { slug: "유록동", name: "유록동" },
      { slug: "자산동", name: "자산동" },
      { slug: "월남동1가", name: "월남동1가" },
      { slug: "예곡동", name: "예곡동" },
      { slug: "진북면", name: "진북면" },
      { slug: "월남동2가", name: "월남동2가" },
      { slug: "월남동3가", name: "월남동3가" },
      { slug: "월남동4가", name: "월남동4가" },
      { slug: "창원시마산합포구", name: "창원시마산합포구" },
      { slug: "중성동", name: "중성동" },
      { slug: "중앙동1가", name: "중앙동1가" },
      { slug: "증앙동2가", name: "증앙동2가" },
      { slug: "중앙동3가", name: "중앙동3가" },
      { slug: "교방동", name: "교방동" },
      { slug: "교원동", name: "교원동" },
      { slug: "남성동", name: "남성동" },
      { slug: "대내동", name: "대내동" },
      { slug: "대성동1가", name: "대성동1가" },
      { slug: "대성동2가", name: "대성동2가" },
      { slug: "대외동", name: "대외동" },
      { slug: "대창동", name: "대창동" },
      { slug: "산호동", name: "산호동" },
      { slug: "상남동", name: "상남동" },
      { slug: "서성동", name: "서성동" },
      { slug: "성호동", name: "성호동" },
      { slug: "창포동1가", name: "창포동1가" },
      { slug: "창동", name: "창동" },
      { slug: "평화동", name: "평화동" },
      { slug: "화영동", name: "화영동" },
      { slug: "해운동", name: "해운동" },
      { slug: "현동", name: "현동" },
      { slug: "홍문동", name: "홍문동" },
      { slug: "구산면", name: "구산면" },
      { slug: "신포동2가", name: "신포동2가" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "완월동", name: "완월동" },
      { slug: "수성동", name: "수성동" },
      { slug: "신월동", name: "신월동" },
      { slug: "신창동", name: "신창동" },
      { slug: "진전면", name: "진전면" },
      { slug: "문화동", name: "문화동" },
      { slug: "반월동", name: "반월동" },
      { slug: "부림동", name: "부림동" },
      { slug: "월영동", name: "월영동" },
      { slug: "월포동", name: "월포동" },
      { slug: "진동면", name: "진동면" },
      { slug: "장군동1가", name: "장군동1가" },
      { slug: "장군동2가", name: "장군동2가" },
      { slug: "장군동5가", name: "장군동5가" },
      { slug: "가포동", name: "가포동" }
    ] },
    { slug: "고성군", name: "고성군", nameEn: "", dongs: [
      { slug: "하일면", name: "하일면" },
      { slug: "하이면", name: "하이면" },
      { slug: "상리면", name: "상리면" },
      { slug: "마암면", name: "마암면" },
      { slug: "삼산면", name: "삼산면" },
      { slug: "동해면", name: "동해면" },
      { slug: "회화면", name: "회화면" },
      { slug: "영현면", name: "영현면" },
      { slug: "영오면", name: "영오면" },
      { slug: "거류면", name: "거류면" },
      { slug: "고성군", name: "고성군" },
      { slug: "개천면", name: "개천면" },
      { slug: "대가면", name: "대가면" },
      { slug: "고성읍", name: "고성읍" },
      { slug: "구만면", name: "구만면" }
    ] },
    { slug: "양산시", name: "양산시", nameEn: "", dongs: [
      { slug: "유산동", name: "유산동" },
      { slug: "어곡동", name: "어곡동" },
      { slug: "용당동", name: "용당동" },
      { slug: "원동면", name: "원동면" },
      { slug: "하북면", name: "하북면" },
      { slug: "교동", name: "교동" },
      { slug: "동면", name: "동면" },
      { slug: "삼호동", name: "삼호동" },
      { slug: "명동", name: "명동" },
      { slug: "주남동", name: "주남동" },
      { slug: "소주동", name: "소주동" },
      { slug: "주진동", name: "주진동" },
      { slug: "평산동", name: "평산동" },
      { slug: "덕계동", name: "덕계동" },
      { slug: "매곡동", name: "매곡동" },
      { slug: "물금읍", name: "물금읍" },
      { slug: "중부동", name: "중부동" },
      { slug: "북부동", name: "북부동" },
      { slug: "명곡동", name: "명곡동" },
      { slug: "신기동", name: "신기동" },
      { slug: "북정동", name: "북정동" },
      { slug: "산막동", name: "산막동" },
      { slug: "호계동", name: "호계동" },
      { slug: "양산시", name: "양산시" },
      { slug: "다방동", name: "다방동" },
      { slug: "남부동", name: "남부동" },
      { slug: "상북면", name: "상북면" }
    ] },
    { slug: "진주시", name: "진주시", nameEn: "", dongs: [
      { slug: "이현동", name: "이현동" },
      { slug: "유곡동", name: "유곡동" },
      { slug: "판문동", name: "판문동" },
      { slug: "이반성면", name: "이반성면" },
      { slug: "집현면", name: "집현면" },
      { slug: "미천면", name: "미천면" },
      { slug: "충무공동", name: "충무공동" },
      { slug: "문산읍", name: "문산읍" },
      { slug: "금산면", name: "금산면" },
      { slug: "수정동", name: "수정동" },
      { slug: "장대동", name: "장대동" },
      { slug: "옥봉동", name: "옥봉동" },
      { slug: "상봉동", name: "상봉동" },
      { slug: "지수면", name: "지수면" },
      { slug: "호탄동", name: "호탄동" },
      { slug: "인사동", name: "인사동" },
      { slug: "대안동", name: "대안동" },
      { slug: "평안동", name: "평안동" },
      { slug: "중안동", name: "중안동" },
      { slug: "계동", name: "계동" },
      { slug: "봉곡동", name: "봉곡동" },
      { slug: "대곡면", name: "대곡면" },
      { slug: "상대동", name: "상대동" },
      { slug: "하대동", name: "하대동" },
      { slug: "상평동", name: "상평동" },
      { slug: "초전동", name: "초전동" },
      { slug: "장재동", name: "장재동" },
      { slug: "하촌동", name: "하촌동" },
      { slug: "신안동", name: "신안동" },
      { slug: "평거동", name: "평거동" },
      { slug: "진성면", name: "진성면" },
      { slug: "정촌면", name: "정촌면" },
      { slug: "수곡면", name: "수곡면" },
      { slug: "대평면", name: "대평면" },
      { slug: "사봉면", name: "사봉면" },
      { slug: "일반성면", name: "일반성면" },
      { slug: "봉래동", name: "봉래동" },
      { slug: "내동면", name: "내동면" },
      { slug: "귀곡동", name: "귀곡동" },
      { slug: "가좌동", name: "가좌동" },
      { slug: "명석면", name: "명석면" },
      { slug: "금곡면", name: "금곡면" },
      { slug: "진주시", name: "진주시" },
      { slug: "망경동", name: "망경동" },
      { slug: "주약동", name: "주약동" },
      { slug: "강남동", name: "강남동" },
      { slug: "칠암동", name: "칠암동" },
      { slug: "본성동", name: "본성동" },
      { slug: "동성동", name: "동성동" },
      { slug: "남성동", name: "남성동" }
    ] },
    { slug: "하동군", name: "하동군", nameEn: "", dongs: [
      { slug: "양보면", name: "양보면" },
      { slug: "청암면", name: "청암면" },
      { slug: "금성면", name: "금성면" },
      { slug: "고전면", name: "고전면" },
      { slug: "금남면", name: "금남면" },
      { slug: "횡천면", name: "횡천면" },
      { slug: "화개면", name: "화개면" },
      { slug: "하동군", name: "하동군" },
      { slug: "적량면", name: "적량면" },
      { slug: "진교면", name: "진교면" },
      { slug: "옥종면", name: "옥종면" },
      { slug: "북천면", name: "북천면" },
      { slug: "하동읍", name: "하동읍" },
      { slug: "악양면", name: "악양면" }
    ] },
    { slug: "창녕군", name: "창녕군", nameEn: "", dongs: [
      { slug: "영산면", name: "영산면" },
      { slug: "이방면", name: "이방면" },
      { slug: "성산면", name: "성산면" },
      { slug: "장마면", name: "장마면" },
      { slug: "유어면", name: "유어면" },
      { slug: "대지면", name: "대지면" },
      { slug: "남지읍", name: "남지읍" },
      { slug: "도천면", name: "도천면" },
      { slug: "계성면", name: "계성면" },
      { slug: "길곡면", name: "길곡면" },
      { slug: "고암면", name: "고암면" },
      { slug: "부곡면", name: "부곡면" },
      { slug: "창녕읍", name: "창녕읍" },
      { slug: "창녕군", name: "창녕군" },
      { slug: "대합면", name: "대합면" }
    ] },
    { slug: "밀양시", name: "밀양시", nameEn: "", dongs: [
      { slug: "단장면", name: "단장면" },
      { slug: "청도면", name: "청도면" },
      { slug: "삼문동", name: "삼문동" },
      { slug: "남포동", name: "남포동" },
      { slug: "용평동", name: "용평동" },
      { slug: "부북면", name: "부북면" },
      { slug: "초동면", name: "초동면" },
      { slug: "무안면", name: "무안면" },
      { slug: "활성동", name: "활성동" },
      { slug: "가곡동", name: "가곡동" },
      { slug: "삼랑진읍", name: "삼랑진읍" },
      { slug: "상동면", name: "상동면" },
      { slug: "산내면", name: "산내면" },
      { slug: "상남면", name: "상남면" },
      { slug: "밀양시", name: "밀양시" },
      { slug: "내일동", name: "내일동" },
      { slug: "내이동", name: "내이동" },
      { slug: "교동", name: "교동" },
      { slug: "하남읍", name: "하남읍" },
      { slug: "산외면", name: "산외면" }
    ] },
    { slug: "함안군", name: "함안군", nameEn: "", dongs: [
      { slug: "함안면", name: "함안면" },
      { slug: "함안군", name: "함안군" },
      { slug: "법수면", name: "법수면" },
      { slug: "칠북면", name: "칠북면" },
      { slug: "칠원읍", name: "칠원읍" },
      { slug: "가야읍", name: "가야읍" },
      { slug: "대산면", name: "대산면" },
      { slug: "칠서면", name: "칠서면" },
      { slug: "여항면", name: "여항면" },
      { slug: "군북면", name: "군북면" },
      { slug: "산인면", name: "산인면" },
      { slug: "칠원면", name: "칠원면" }
    ] },
    { slug: "사천시", name: "사천시", nameEn: "", dongs: [
      { slug: "정동면", name: "정동면" },
      { slug: "곤명면", name: "곤명면" },
      { slug: "축동면", name: "축동면" },
      { slug: "봉남동", name: "봉남동" },
      { slug: "이금동", name: "이금동" },
      { slug: "곤양면", name: "곤양면" },
      { slug: "용현면", name: "용현면" },
      { slug: "사등동", name: "사등동" },
      { slug: "향촌동", name: "향촌동" },
      { slug: "대방동", name: "대방동" },
      { slug: "실안동", name: "실안동" },
      { slug: "마도동", name: "마도동" },
      { slug: "늑도동", name: "늑도동" },
      { slug: "백천동", name: "백천동" },
      { slug: "신벽동", name: "신벽동" },
      { slug: "노룡동", name: "노룡동" },
      { slug: "대포동", name: "대포동" },
      { slug: "송포동", name: "송포동" },
      { slug: "죽림동", name: "죽림동" },
      { slug: "사천읍", name: "사천읍" },
      { slug: "동금동", name: "동금동" },
      { slug: "서금동", name: "서금동" },
      { slug: "동림동", name: "동림동" },
      { slug: "좌룡동", name: "좌룡동" },
      { slug: "벌리동", name: "벌리동" },
      { slug: "용강동", name: "용강동" },
      { slug: "서포면", name: "서포면" },
      { slug: "사남면", name: "사남면" },
      { slug: "이홀동", name: "이홀동" },
      { slug: "궁지동", name: "궁지동" },
      { slug: "사천시", name: "사천시" },
      { slug: "동동", name: "동동" },
      { slug: "서동", name: "서동" },
      { slug: "선구동", name: "선구동" },
      { slug: "와룡동", name: "와룡동" }
    ] },
    { slug: "창원시 의창구", name: "창원시 의창구", nameEn: "", dongs: [
      { slug: "용동", name: "용동" },
      { slug: "창원시 의창구", name: "창원시 의창구" },
      { slug: "북동", name: "북동" },
      { slug: "중동", name: "중동" },
      { slug: "서상동", name: "서상동" },
      { slug: "소답동", name: "소답동" },
      { slug: "사림동", name: "사림동" },
      { slug: "지귀동", name: "지귀동" },
      { slug: "서곡동", name: "서곡동" },
      { slug: "봉림동", name: "봉림동" },
      { slug: "대산면", name: "대산면" },
      { slug: "봉곡동", name: "봉곡동" },
      { slug: "차용동", name: "차용동" },
      { slug: "내리동", name: "내리동" },
      { slug: "명서동", name: "명서동" },
      { slug: "덕정동", name: "덕정동" },
      { slug: "북면", name: "북면" },
      { slug: "팔용동", name: "팔용동" },
      { slug: "동읍", name: "동읍" },
      { slug: "퇴촌동", name: "퇴촌동" },
      { slug: "명곡동", name: "명곡동" },
      { slug: "반계동", name: "반계동" },
      { slug: "사화동", name: "사화동" },
      { slug: "도계동", name: "도계동" },
      { slug: "동정동", name: "동정동" },
      { slug: "소계동", name: "소계동" },
      { slug: "용지동", name: "용지동" },
      { slug: "삼동동", name: "삼동동" },
      { slug: "두대동", name: "두대동" },
      { slug: "반송동", name: "반송동" },
      { slug: "대원동", name: "대원동" },
      { slug: "신월동", name: "신월동" },
      { slug: "용호동", name: "용호동" },
      { slug: "창원시의창구", name: "창원시의창구" }
    ] },
    { slug: "창원시 성산구", name: "창원시 성산구", nameEn: "", dongs: [
      { slug: "용지동", name: "용지동" },
      { slug: "남산동", name: "남산동" },
      { slug: "삼정자동", name: "삼정자동" },
      { slug: "천선동", name: "천선동" },
      { slug: "불모산동", name: "불모산동" },
      { slug: "안민동", name: "안민동" },
      { slug: "내동", name: "내동" },
      { slug: "남지동", name: "남지동" },
      { slug: "상복동", name: "상복동" },
      { slug: "완암동", name: "완암동" },
      { slug: "창곡동", name: "창곡동" },
      { slug: "두대동", name: "두대동" },
      { slug: "삼동동", name: "삼동동" },
      { slug: "덕정동", name: "덕정동" },
      { slug: "반림동", name: "반림동" },
      { slug: "상남동", name: "상남동" },
      { slug: "성주동", name: "성주동" },
      { slug: "웅남동", name: "웅남동" },
      { slug: "사파동", name: "사파동" },
      { slug: "반송동", name: "반송동" },
      { slug: "신월동", name: "신월동" },
      { slug: "창원시성산구", name: "창원시성산구" },
      { slug: "토월동", name: "토월동" },
      { slug: "용호동", name: "용호동" },
      { slug: "퇴촌동", name: "퇴촌동" },
      { slug: "대원동", name: "대원동" },
      { slug: "월림동", name: "월림동" },
      { slug: "적현동", name: "적현동" },
      { slug: "양곡동", name: "양곡동" },
      { slug: "귀산동", name: "귀산동" },
      { slug: "귀곡동", name: "귀곡동" },
      { slug: "귀현동", name: "귀현동" },
      { slug: "신촌동", name: "신촌동" },
      { slug: "반지동", name: "반지동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "사파정동", name: "사파정동" },
      { slug: "가음정동", name: "가음정동" },
      { slug: "외동", name: "외동" },
      { slug: "대방동", name: "대방동" },
      { slug: "성산동", name: "성산동" },
      { slug: "남양동", name: "남양동" },
      { slug: "가음동", name: "가음동" }
    ] },
    { slug: "김해시", name: "김해시", nameEn: "", dongs: [
      { slug: "외동", name: "외동" },
      { slug: "흥동", name: "흥동" },
      { slug: "풍유동", name: "풍유동" },
      { slug: "명법동", name: "명법동" },
      { slug: "이동", name: "이동" },
      { slug: "화목동", name: "화목동" },
      { slug: "부원동", name: "부원동" },
      { slug: "주촌면", name: "주촌면" },
      { slug: "장유동", name: "장유동" },
      { slug: "응달동", name: "응달동" },
      { slug: "동상동", name: "동상동" },
      { slug: "서상동", name: "서상동" },
      { slug: "김해시", name: "김해시" },
      { slug: "대동면", name: "대동면" },
      { slug: "전하동", name: "전하동" },
      { slug: "수가동", name: "수가동" },
      { slug: "강동", name: "강동" },
      { slug: "한림면", name: "한림면" },
      { slug: "어방동", name: "어방동" },
      { slug: "삼방동", name: "삼방동" },
      { slug: "삼정동", name: "삼정동" },
      { slug: "진례면", name: "진례면" },
      { slug: "상동면", name: "상동면" },
      { slug: "생림면", name: "생림면" },
      { slug: "봉황동", name: "봉황동" },
      { slug: "대성동", name: "대성동" },
      { slug: "구산동", name: "구산동" },
      { slug: "삼계동", name: "삼계동" },
      { slug: "내동", name: "내동" },
      { slug: "안동", name: "안동" },
      { slug: "지내동", name: "지내동" },
      { slug: "불암동", name: "불암동" },
      { slug: "유하동", name: "유하동" },
      { slug: "내덕동", name: "내덕동" },
      { slug: "부곡동", name: "부곡동" },
      { slug: "무계동", name: "무계동" },
      { slug: "신문동", name: "신문동" },
      { slug: "삼문동", name: "삼문동" },
      { slug: "대청동", name: "대청동" },
      { slug: "관동동", name: "관동동" },
      { slug: "율하동", name: "율하동" },
      { slug: "진영읍", name: "진영읍" },
      { slug: "장유면", name: "장유면" }
    ] },
    { slug: "함양군", name: "함양군", nameEn: "", dongs: [
      { slug: "안의면", name: "안의면" },
      { slug: "서상면", name: "서상면" },
      { slug: "서하면", name: "서하면" },
      { slug: "휴천면", name: "휴천면" },
      { slug: "병곡면", name: "병곡면" },
      { slug: "함양군", name: "함양군" },
      { slug: "함양읍", name: "함양읍" },
      { slug: "지곡면", name: "지곡면" },
      { slug: "백전면", name: "백전면" },
      { slug: "수동면", name: "수동면" },
      { slug: "마천면", name: "마천면" },
      { slug: "유림면", name: "유림면" }
    ] },
    { slug: "통영시", name: "통영시", nameEn: "", dongs: [
      { slug: "인평동", name: "인평동" },
      { slug: "당동", name: "당동" },
      { slug: "미수동", name: "미수동" },
      { slug: "태평동", name: "태평동" },
      { slug: "동호동", name: "동호동" },
      { slug: "정량동", name: "정량동" },
      { slug: "북신동", name: "북신동" },
      { slug: "무전동", name: "무전동" },
      { slug: "평림동", name: "평림동" },
      { slug: "한산면", name: "한산면" },
      { slug: "도산면", name: "도산면" },
      { slug: "용남면", name: "용남면" },
      { slug: "봉평동", name: "봉평동" },
      { slug: "도남동", name: "도남동" },
      { slug: "사량면", name: "사량면" },
      { slug: "산양읍", name: "산양읍" },
      { slug: "광도면", name: "광도면" },
      { slug: "욕지면", name: "욕지면" },
      { slug: "통영시", name: "통영시" },
      { slug: "도천동", name: "도천동" },
      { slug: "서호동", name: "서호동" },
      { slug: "명정동", name: "명정동" },
      { slug: "항남동", name: "항남동" },
      { slug: "중앙동", name: "중앙동" },
      { slug: "문화동", name: "문화동" }
    ] },
    { slug: "창원시", name: "창원시", nameEn: "", dongs: [
      { slug: "창원시", name: "창원시" }
    ] },
    { slug: "남해군", name: "남해군", nameEn: "", dongs: [
      { slug: "삼동면", name: "삼동면" },
      { slug: "이동면", name: "이동면" },
      { slug: "남해읍", name: "남해읍" },
      { slug: "남면", name: "남면" },
      { slug: "미조면", name: "미조면" },
      { slug: "서면", name: "서면" },
      { slug: "창선면", name: "창선면" },
      { slug: "고현면", name: "고현면" },
      { slug: "상주면", name: "상주면" },
      { slug: "설천면", name: "설천면" },
      { slug: "남해군", name: "남해군" }
    ] },
    { slug: "창원시마산회원구", name: "창원시마산회원구", nameEn: "", dongs: [
      { slug: "구암동", name: "구암동" },
      { slug: "창원시마산회원구", name: "창원시마산회원구" },
      { slug: "합성동", name: "합성동" },
      { slug: "회성동", name: "회성동" },
      { slug: "회원동", name: "회원동" },
      { slug: "내서읍", name: "내서읍" },
      { slug: "두척동", name: "두척동" },
      { slug: "봉암동", name: "봉암동" },
      { slug: "석전동", name: "석전동" },
      { slug: "양덕동", name: "양덕동" }
    ] },
    { slug: "창원시 마산회원구", name: "창원시 마산회원구", nameEn: "", dongs: [
      { slug: "내서읍", name: "내서읍" },
      { slug: "석전동", name: "석전동" },
      { slug: "회원동", name: "회원동" },
      { slug: "합성동", name: "합성동" },
      { slug: "두척동", name: "두척동" },
      { slug: "회성동", name: "회성동" },
      { slug: "양덕동", name: "양덕동" },
      { slug: "봉암동", name: "봉암동" },
      { slug: "구암동", name: "구암동" },
      { slug: "창원시마산회원구", name: "창원시마산회원구" }
    ] },
    { slug: "창원시 마산합포구", name: "창원시 마산합포구", nameEn: "", dongs: [
      { slug: "상남동", name: "상남동" },
      { slug: "남성동", name: "남성동" },
      { slug: "동성동", name: "동성동" },
      { slug: "부림동", name: "부림동" },
      { slug: "서성동", name: "서성동" },
      { slug: "성호동", name: "성호동" },
      { slug: "수성동", name: "수성동" },
      { slug: "신포동1가", name: "신포동1가" },
      { slug: "신포동2가", name: "신포동2가" },
      { slug: "오동동", name: "오동동" },
      { slug: "중성동", name: "중성동" },
      { slug: "대창동", name: "대창동" },
      { slug: "두월동1가", name: "두월동1가" },
      { slug: "두월동2가", name: "두월동2가" },
      { slug: "두월동3가", name: "두월동3가" },
      { slug: "문화동", name: "문화동" },
      { slug: "신창동", name: "신창동" },
      { slug: "월남동1가", name: "월남동1가" },
      { slug: "월남동2가", name: "월남동2가" },
      { slug: "월남동3가", name: "월남동3가" },
      { slug: "월남동4가", name: "월남동4가" },
      { slug: "월남동5가", name: "월남동5가" },
      { slug: "월영동", name: "월영동" },
      { slug: "유록동", name: "유록동" },
      { slug: "창포동1가", name: "창포동1가" },
      { slug: "창포동2가", name: "창포동2가" },
      { slug: "창포동3가", name: "창포동3가" },
      { slug: "청계동", name: "청계동" },
      { slug: "평화동", name: "평화동" },
      { slug: "화영동", name: "화영동" },
      { slug: "홍문동", name: "홍문동" },
      { slug: "대성동1가", name: "대성동1가" },
      { slug: "대성동2가", name: "대성동2가" },
      { slug: "반월동", name: "반월동" },
      { slug: "신월동", name: "신월동" },
      { slug: "신흥동", name: "신흥동" },
      { slug: "완월동", name: "완월동" },
      { slug: "월포동", name: "월포동" },
      { slug: "장군동1가", name: "장군동1가" },
      { slug: "장군동2가", name: "장군동2가" },
      { slug: "장군동3가", name: "장군동3가" },
      { slug: "중앙동1가", name: "중앙동1가" },
      { slug: "중앙동2가", name: "중앙동2가" },
      { slug: "중앙동3가", name: "중앙동3가" },
      { slug: "장군동4가", name: "장군동4가" },
      { slug: "장군동5가", name: "장군동5가" },
      { slug: "교방동", name: "교방동" },
      { slug: "자산동", name: "자산동" },
      { slug: "교원동", name: "교원동" },
      { slug: "창동", name: "창동" },
      { slug: "추산동", name: "추산동" },
      { slug: "산호동", name: "산호동" },
      { slug: "현동", name: "현동" },
      { slug: "가포동", name: "가포동" },
      { slug: "대내동", name: "대내동" },
      { slug: "해운동", name: "해운동" },
      { slug: "대외동", name: "대외동" },
      { slug: "진전면", name: "진전면" },
      { slug: "창원시마산합포구", name: "창원시마산합포구" },
      { slug: "구산면", name: "구산면" },
      { slug: "진동면", name: "진동면" },
      { slug: "진북면", name: "진북면" },
      { slug: "덕동동", name: "덕동동" },
      { slug: "예곡동", name: "예곡동" },
      { slug: "우산동", name: "우산동" }
    ] }
  ],
    districtCount: 18,
    dongCount: 308,
    characteristics: {
      summary: "\uC870\uC120\xB7\uAE30\uACC4 \uC0B0\uC5C5 \uC911\uC2EC\uC9C0\uC640 \uB0A8\uD574\uC548 \uAD00\uAD11\xB7\uC218\uC0B0 \uC790\uC6D0\uC774 \uD48D\uBD80\uD55C \uC9C0\uC5ED",
      storeTypes: ["\uACF5\uB2E8 \uC2DD\uB2F9\xB7\uCE74\uD398", "\uD574\uC548 \uD69F\uC9D1", "\uAD00\uAD11\uC9C0 \uD39C\uC158", "\uB300\uD559\uAC00 \uB9E4\uC7A5"],
      customerBase: ["\uC870\uC120\xB7\uAE30\uACC4 \uADFC\uB85C\uC790", "\uAD00\uAD11\uAC1D", "\uACBD\uB0A8 \uB3C4\uBBFC", "\uB300\uD559\uC0DD"],
      businessHours: "\uACF5\uB2E8 3\uAD50\uB300 \uB300\uC751, \uC8FC\uB9D0 \uAD00\uAD11\uC9C0 \uC9D1\uC911"
    },
    businessEnvironment: {
      majorIndustries: ["\uC870\uC120\xB7\uAE30\uACC4", "\uC790\uB3D9\uCC28\xB7\uD56D\uACF5", "\uD574\uC591 \uAD00\uAD11", "\uB18D\xB7\uC218\uC0B0\uC5C5"],
      commercialAreas: ["\uCC3D\uC6D0 \uC0C1\uB0A8\uB3D9", "\uC9C4\uC8FC \uD601\uC2E0\uB3C4\uC2DC", "\uAE40\uD574 \uC7A5\uC720", "\uAC70\uC81C \uACE0\uD604\uB3D9"],
      infrastructure: ["\uCC3D\uC6D0\uAD6D\uAC00\uC0B0\uC5C5\uB2E8\uC9C0", "\uC0BC\uC131\xB7\uB300\uC6B0\uC870\uC120", "KTX \uCC3D\uC6D0\uC5ED", "\uAC70\uC81C \uC625\uD3EC\uC870\uC120"]
    },
    installationTips: [
      "\uC870\uC120\uC18C \uB300\uD615 \uC7A5\uBE44 \uC5F0\uACC4 B2B \uC194\uB8E8\uC158",
      "\uB0A8\uD574\uC548 \uD69F\uC9D1\xB7\uC218\uC0B0 \uC2DC\uC7A5 \uBC29\uC218 \uC7A5\uBE44",
      "\uACF5\uB2E8 3\uAD50\uB300 \uADFC\uB85C\uC790 \uC2EC\uC57C \uC6B4\uC601",
      "\uC678\uAD6D\uC778 \uC5D4\uC9C0\uB2C8\uC5B4 \uB2E4\uAD6D\uC5B4 \uACB0\uC81C"
    ],
    featuredDistricts: [
      { name: "\uCC3D\uC6D0\uC2DC", description: "\uACBD\uB0A8 \uCD5C\uB300 \uB3C4\uC2DC, \uACF5\uB2E8\uACFC \uC8FC\uAC70 \uBCF5\uD569" },
      { name: "\uC9C4\uC8FC\uC2DC", description: "\uD601\uC2E0\uB3C4\uC2DC\xB7\uC9C4\uC8FC\uC131, \uC5ED\uC0AC\xB7\uC2E0\uB3C4\uC2DC \uACF5\uC874" },
      { name: "\uAE40\uD574\uC2DC", description: "\uACF5\uD56D \uC5F0\uACC4\xB7\uC7A5\uC720 \uC2E0\uB3C4\uC2DC, \uC131\uC7A5 \uC0C1\uAD8C" },
      { name: "\uAC70\uC81C\uC2DC", description: "\uC870\uC120\uC18C \uC911\uC2EC \uB3C4\uC2DC, \uD574\uC548 \uAD00\uAD11\uC9C0" }
    ]
  }
];
function findRegion(regionSlug) {
  return regions.find(
    (r) => r.nameKoShort === regionSlug || r.nameKo === regionSlug || r.code === regionSlug
  );
}
function findDistrict(region, districtSlug) {
  return region.districts.find(
    (d) => d.slug === districtSlug || d.name === districtSlug
  );
}
function findDong(district, dongSlug) {
  return district.dongs.find((d) => d.slug === dongSlug || d.name === dongSlug);
}
function resolveRegionPath(regionSlug, districtSlug, dongSlug) {
  if (!regionSlug)
    return {};
  const region = findRegion(regionSlug);
  if (!region)
    return {};
  if (!districtSlug)
    return { region };
  const district = findDistrict(region, districtSlug);
  if (!district)
    return { region };
  if (!dongSlug)
    return { region, district };
  const dong = findDong(district, dongSlug);
  return { region, district, dong };
}

// src/data/products.ts
var products = [
  {
    slug: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    name: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    nameEn: "Card Terminal",
    icon: "\u{1F4B3}",
    tagline: "\uC720\uC120\xB7\uBB34\uC120\xB7\uBE14\uB8E8\uD22C\uC2A4\uAE4C\uC9C0",
    description: "\uC720\uC120\xB7\uBB34\uC120\xB7\uBE14\uB8E8\uD22C\uC2A4\xB7\uC790\uB3D9\uCEE4\uD305\uAE4C\uC9C0. VAN\uC0AC \uC218\uC218\uB8CC\uB97C \uBE44\uAD50\uD574 \uAC00\uC7A5 \uC720\uB9AC\uD55C \uC870\uAC74\uC73C\uB85C \uC124\uCE58\uD569\uB2C8\uB2E4.",
    metaCount: "4\uAC00\uC9C0 \uBAA8\uB378",
    features: [
      "\uC720\uC120 \uB2E8\uB9D0\uAE30 (\uC548\uC815\uC801 \uCE74\uC6B4\uD130 \uACB0\uC81C)",
      "\uBB34\uC120 \uB2E8\uB9D0\uAE30 (\uC774\uB3D9\xB7\uD14C\uC774\uBE14 \uACB0\uC81C)",
      "\uBE14\uB8E8\uD22C\uC2A4 \uB2E8\uB9D0\uAE30 (\uC2A4\uB9C8\uD2B8\uD3F0 \uC5F0\uB3D9)",
      "\uC790\uB3D9\uCEE4\uD305 \uB2E8\uB9D0\uAE30 (\uC601\uC218\uC99D \uC790\uB3D9)"
    ],
    useCases: [
      "VAN\uC0AC \uC218\uC218\uB8CC \uBE44\uAD50 \xB7 \uC5F0 \uC218\uC2ED\uB9CC\uC6D0 \uC808\uC57D",
      "\uAE30\uC874 \uB2E8\uB9D0\uAE30 \uAD50\uCCB4 \uC2DC \uBB34\uC0C1 \uC774\uAD00",
      "\uD53C\uD06C \uD0C0\uC784 \uD68C\uC804\uC728 \uAC1C\uC120"
    ],
    specifications: {
      title: "\uAE30\uC220 \uC2A4\uD399",
      items: [
        { label: "\uC9C0\uC6D0 \uCE74\uB4DC", value: "\uC2E0\uC6A9/\uCCB4\uD06C/IC/MST \uC804 \uC885\uB958" },
        { label: "\uACB0\uC81C \uBC29\uC2DD", value: "\uC811\uCD09/\uBE44\uC811\uCD09/NFC/QR\uCF54\uB4DC" },
        { label: "\uD1B5\uC2E0 \uBC29\uC2DD", value: "\uC720\uC120LAN/\uBB34\uC120WiFi/3G/LTE" },
        { label: "\uC601\uC218\uC99D", value: "\uC790\uB3D9\uCEE4\uD305/\uC218\uB3D9 \uC120\uD0DD \uAC00\uB2A5" },
        { label: "\uBC30\uD130\uB9AC", value: "\uBB34\uC120\uD615 8\uC2DC\uAC04 \uC5F0\uC18D \uC0AC\uC6A9" },
        { label: "\uBCF4\uC548 \uB4F1\uAE09", value: "PCI-DSS Level 1 \uC778\uC99D" }
      ]
    },
    costSavings: {
      title: "\uBE44\uC6A9 \uC808\uC57D \uD6A8\uACFC",
      items: [
        { metric: "VAN\uC0AC \uC218\uC218\uB8CC", amount: "\uC5F0\uAC04 120\uB9CC\uC6D0", description: "\uAE30\uC874 2.3% \u2192 1.9%\uB85C \uC808\uC57D (\uC6D4\uB9E4\uCD9C 1,500\uB9CC\uC6D0 \uAE30\uC900)" },
        { metric: "\uB2E8\uB9D0\uAE30 \uC784\uB300\uB8CC", amount: "\uC6D4 1.5\uB9CC\uC6D0", description: "\uAD6C\uB9E4\uD615 \uB2E8\uB9D0\uAE30\uB85C \uC804\uD658 \uC2DC \uC784\uB300\uB8CC \uC644\uC804 \uC808\uC57D" },
        { metric: "\uC124\uCE58\uBE44\uC6A9", amount: "15\uB9CC\uC6D0", description: "\uD0C0\uC0AC \uB300\uBE44 \uBB34\uB8CC \uC124\uCE58 + \uAE30\uC874 \uB2E8\uB9D0\uAE30 \uBB34\uC0C1 \uCCA0\uAC70" }
      ]
    },
    installationCases: [
      {
        title: "\uAC15\uB0A8 \uD504\uB9AC\uBBF8\uC5C4 \uCE74\uD398",
        location: "\uC11C\uC6B8 \uAC15\uB0A8\uAD6C \uC5ED\uC0BC\uB3D9",
        businessType: "\uC2A4\uD398\uC15C\uD2F0 \uCEE4\uD53C \uC804\uBB38\uC810",
        challenge: "\uB192\uC740 VAN \uC218\uC218\uB8CC(2.5%)\uC640 \uC720\uC120 \uB2E8\uB9D0\uAE30\uB85C \uC778\uD55C \uD14C\uC774\uBE14 \uC11C\uBE44\uC2A4 \uBD88\uD3B8",
        solution: "\uBE14\uB8E8\uD22C\uC2A4 \uBB34\uC120 \uB2E8\uB9D0\uAE30 + VAN\uC0AC \uBCC0\uACBD(1.8%)",
        result: "\uC6D4 \uC218\uC218\uB8CC 35\uB9CC\uC6D0 \uC808\uC57D, \uD14C\uC774\uBE14 \uACB0\uC81C\uB85C \uACE0\uAC1D \uB9CC\uC871\uB3C4 95% \uD5A5\uC0C1"
      }
    ],
    faq: [
      {
        question: "VAN\uC0AC \uBCC0\uACBD \uC2DC \uAE30\uC874 \uB2E8\uB9D0\uAE30\uB294 \uC5B4\uB5BB\uAC8C \uB418\uB098\uC694?",
        answer: "\uAE30\uC874 \uB2E8\uB9D0\uAE30 \uBB34\uC0C1 \uCCA0\uAC70\uD574\uB4DC\uB9AC\uACE0, \uC0C8 \uB2E8\uB9D0\uAE30 \uC124\uCE58\uAE4C\uC9C0 \uC2E0\uC18D\uD558\uAC8C \uC644\uB8CC\uD569\uB2C8\uB2E4. VAN\uC0AC \uD574\uC9C0 \uC218\uC218\uB8CC\uB3C4 \uC800\uD76C\uAC00 \uB300\uC2E0 \uCC98\uB9AC\uD574\uB4DC\uB824\uC694."
      },
      {
        question: "\uBB34\uC120 \uB2E8\uB9D0\uAE30 \uBC30\uD130\uB9AC\uB294 \uC5BC\uB9C8\uB098 \uC9C0\uC18D\uB418\uB098\uC694?",
        answer: "\uC77C\uBC18 \uC0AC\uC6A9 \uAE30\uC900 8\uC2DC\uAC04 \uC5F0\uC18D \uC0AC\uC6A9 \uAC00\uB2A5\uD558\uBA70, \uB300\uAE30\uBAA8\uB4DC\uC5D0\uC11C\uB294 48\uC2DC\uAC04\uAE4C\uC9C0 \uC9C0\uC18D\uB429\uB2C8\uB2E4. \uCDA9\uC804 \uC2DC\uAC04\uC740 2\uC2DC\uAC04 \uC815\uB3C4\uC608\uC694."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uCE74\uD398\xB7\uBCA0\uC774\uCEE4\uB9AC",
        description: "\uD14C\uC774\uBE14 \uC11C\uBE44\uC2A4\uC640 \uD3EC\uC7A5 \uC8FC\uBB38\uC774 \uB9CE\uC740 \uC5C5\uC885",
        benefits: ["\uBB34\uC120 \uB2E8\uB9D0\uAE30\uB85C \uD14C\uC774\uBE14 \uACB0\uC81C", "QR\uCF54\uB4DC \uC120\uACB0\uC81C \uC5F0\uB3D9", "VAN \uC218\uC218\uB8CC \uCD5C\uC801\uD654"]
      },
      {
        industry: "\uC2DD\uB2F9\xB7\uCE58\uD0A8\uC9D1",
        description: "\uBC30\uB2EC\uACFC \uD604\uC7A5 \uACB0\uC81C\uAC00 \uB3D9\uC2DC\uC5D0 \uC774\uB904\uC9C0\uB294 \uC5C5\uC885",
        benefits: ["\uC720\uC120+\uBB34\uC120 \uB4C0\uC5BC \uAD6C\uC131", "\uBC30\uB2EC\uC571 \uC815\uC0B0 \uC5F0\uB3D9", "\uC601\uC218\uC99D \uC790\uB3D9\uCEE4\uD305"]
      }
    ],
    relatedProducts: ["\uD3EC\uC2A4\uAE30", "\uD14C\uC774\uBE14\uC624\uB354"]
  },
  {
    slug: "\uD3EC\uC2A4\uAE30",
    name: "\uD3EC\uC2A4\uAE30",
    nameEn: "POS System",
    icon: "\u{1F5A5}\uFE0F",
    tagline: "\uB9E4\uCD9C\xB7\uC7AC\uACE0\xB7\uC138\uBB34 \uD1B5\uD569",
    description: "\uC8FC\uBB38\xB7\uACB0\uC81C\xB7\uB9E4\uCD9C\xB7\uC7AC\uACE0\uB97C \uD558\uB098\uC758 \uD654\uBA74\uC5D0\uC11C. \uC138\uBB34\uC0AC\uC5D0\uAC8C \uBC14\uB85C \uB118\uAE38 \uC218 \uC788\uB294 \uC790\uB3D9 \uB9AC\uD3EC\uD2B8\uAE4C\uC9C0.",
    metaCount: "3\uAC00\uC9C0 \uD0C0\uC785",
    features: [
      "\uC77C\uBC18\uD615 POS (\uC2DD\uB2F9\xB7\uCE74\uD398)",
      "\uBC30\uB2EC \uC5F0\uB3D9 POS (\uBC30\uBBFC\xB7\uCFE0\uD321\uC774\uCE20)",
      "\uD504\uB79C\uCC28\uC774\uC988\uD615 POS (\uB2E4\uC810\uD3EC \uAD00\uB9AC)"
    ],
    useCases: [
      "\uC694\uC77C\uBCC4\xB7\uC2DC\uAC04\uB300\uBCC4 \uB9E4\uCD9C \uC790\uB3D9 \uBD84\uC11D",
      "\uC7AC\uACE0 \uBD80\uC871 \uC54C\uB9BC",
      "\uC138\uBB34\uC0AC \uC774\uAD00\uC6A9 \uC790\uB3D9 \uB9AC\uD3EC\uD2B8"
    ],
    specifications: {
      title: "\uC2DC\uC2A4\uD15C \uC0AC\uC591",
      items: [
        { label: "\uD654\uBA74 \uD06C\uAE30", value: "15\uC778\uCE58 / 21\uC778\uCE58 \uD130\uCE58\uC2A4\uD06C\uB9B0" },
        { label: "\uC6B4\uC601 \uCCB4\uC81C", value: "Windows 11 / Android \uB4C0\uC5BC \uC9C0\uC6D0" },
        { label: "\uD504\uB9B0\uD130 \uC5F0\uB3D9", value: "\uC601\uC218\uC99D 80mm \xB7 \uC8FC\uBC29 \uD504\uB9B0\uD130 3\uB300\uAE4C\uC9C0" },
        { label: "\uACB0\uC81C \uC5F0\uB3D9", value: "\uBAA8\uB4E0 \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \xB7 \uAC04\uD3B8\uACB0\uC81C \uD1B5\uD569" },
        { label: "\uBC30\uB2EC\uC571 \uC5F0\uB3D9", value: "\uBC30\uBBFC\xB7\uCFE0\uD321\uC774\uCE20\xB7\uC694\uAE30\uC694\xB7\uB561\uACA8\uC694 \uC2E4\uC2DC\uAC04" },
        { label: "\uC138\uBB34 \uB9AC\uD3EC\uD2B8", value: "\uBD80\uAC00\uC138/\uC18C\uB4DD\uC138 \uC790\uB3D9 \uBD84\uB958\xB7\uC5D1\uC140 \uCD9C\uB825" }
      ]
    },
    costSavings: {
      title: "\uC6B4\uC601 \uD6A8\uC728 \uAC1C\uC120",
      items: [
        { metric: "\uC7AC\uACE0 \uC190\uC2E4 \uBC29\uC9C0", amount: "\uC6D4 80\uB9CC\uC6D0", description: "\uC790\uB3D9 \uC7AC\uACE0 \uAD00\uB9AC\uB85C \uC720\uD1B5\uAE30\uD55C\xB7\uC7AC\uB8CC \uC190\uC2E4 80% \uAC10\uC18C" },
        { metric: "\uC138\uBB34 \uC5C5\uBB34 \uC2DC\uAC04", amount: "\uC6D4 20\uC2DC\uAC04", description: "\uC218\uAE30 \uC7A5\uBD80 \uB300\uC2E0 \uC790\uB3D9 \uB9AC\uD3EC\uD2B8\uB85C \uC138\uBB34\uC0AC \uC774\uAD00 \uC989\uC2DC \uAC00\uB2A5" },
        { metric: "\uB9E4\uCD9C \uBD84\uC11D \uD6A8\uACFC", amount: "\uC6D4 150\uB9CC\uC6D0", description: "\uC2DC\uAC04\uB300\xB7\uBA54\uB274\uBCC4 \uBD84\uC11D\uC73C\uB85C \uC7AC\uB8CC \uBC1C\uC8FC\xB7\uC778\uB825 \uBC30\uCE58 \uCD5C\uC801\uD654" }
      ]
    },
    installationCases: [
      {
        title: "\uAC15\uB0A8 \uC77C\uC2DD\uB2F9",
        location: "\uC11C\uC6B8 \uAC15\uB0A8\uAD6C \uB17C\uD604\uB3D9",
        businessType: "\uD504\uB9AC\uBBF8\uC5C4 \uC77C\uC2DD \uB808\uC2A4\uD1A0\uB791 (\uD14C\uC774\uBE14 30\uAC1C)",
        challenge: "\uC218\uAE30 \uC8FC\uBB38\uC73C\uB85C \uC778\uD55C \uC2E4\uC218 \uBE48\uBC1C, \uC6D4\uB9D0 \uC815\uC0B0\uC5D0 3\uC77C \uC18C\uC694",
        solution: "\uC77C\uBC18\uD615 POS + \uC8FC\uBC29 \uD504\uB9B0\uD130 3\uB300 + \uC138\uBB34 \uC790\uB3D9 \uB9AC\uD3EC\uD2B8",
        result: "\uC8FC\uBB38 \uC2E4\uC218 95% \uAC10\uC18C, \uC6D4\uB9D0 \uC815\uC0B0 3\uC2DC\uAC04\uC73C\uB85C \uB2E8\uCD95, \uB9E4\uCD9C 20% \uC99D\uAC00"
      },
      {
        title: "\uBD84\uB2F9 \uD504\uB79C\uCC28\uC774\uC988 \uCE58\uD0A8",
        location: "\uACBD\uAE30 \uC131\uB0A8\uC2DC \uBD84\uB2F9\uAD6C",
        businessType: "\uCE58\uD0A8 \uD504\uB79C\uCC28\uC774\uC988 3\uAC1C \uB9E4\uC7A5",
        challenge: "3\uAC1C \uB9E4\uC7A5 \uB9E4\uCD9C \uD1B5\uD569 \uAD00\uB9AC \uC5B4\uB824\uC6C0, \uBC30\uB2EC\uC571 \uC815\uC0B0 \uBCF5\uC7A1",
        solution: "\uD504\uB79C\uCC28\uC774\uC988\uD615 POS + \uBC30\uB2EC\uC571 4\uAC1C \uD1B5\uD569 \uC5F0\uB3D9",
        result: "3\uAC1C \uB9E4\uC7A5 \uC2E4\uC2DC\uAC04 \uD1B5\uD569 \uAD00\uB9AC, \uBC30\uB2EC \uC815\uC0B0 \uC624\uB958 \uC81C\uB85C"
      }
    ],
    faq: [
      {
        question: "\uAE30\uC874 POS \uB370\uC774\uD130 \uC774\uC804\uC774 \uAC00\uB2A5\uD55C\uAC00\uC694?",
        answer: "\uB124, \uB300\uBD80\uBD84\uC758 POS \uC2DC\uC2A4\uD15C \uB370\uC774\uD130\uB97C 100% \uC774\uC804 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uBA54\uB274\xB7\uC7AC\uACE0\xB7\uACE0\uAC1D \uB370\uC774\uD130 \uBAA8\uB450 \uBB34\uB8CC\uB85C \uC774\uC804\uD574\uB4DC\uB824\uC694."
      },
      {
        question: "\uC778\uD130\uB137\uC774 \uB04A\uAE30\uBA74 POS\uB97C \uC4F8 \uC218 \uC5C6\uB098\uC694?",
        answer: "\uC624\uD504\uB77C\uC778 \uBAA8\uB4DC\uB97C \uC9C0\uC6D0\uD569\uB2C8\uB2E4. \uC778\uD130\uB137 \uBCF5\uAD6C \uC2DC \uC790\uB3D9\uC73C\uB85C \uC11C\uBC84\uC5D0 \uB3D9\uAE30\uD654\uB418\uB2C8 \uAC71\uC815 \uC5C6\uC5B4\uC694."
      },
      {
        question: "\uC138\uBB34\uC0AC\uD55C\uD14C \uB118\uAE30\uB294 \uB9AC\uD3EC\uD2B8\uB294 \uC5B4\uB5A4 \uD615\uD0DC\uC778\uAC00\uC694?",
        answer: "\uC5D1\uC140\xB7PDF\uB85C \uBD80\uAC00\uC138\xB7\uC18C\uB4DD\uC138\uBCC4\uB85C \uC790\uB3D9 \uBD84\uB958\uB41C \uB9AC\uD3EC\uD2B8\uAC00 \uC6D4 \uB2E8\uC704\uB85C \uC0DD\uC131\uB429\uB2C8\uB2E4. \uC138\uBB34\uC0AC\uAC00 \uAC00\uC7A5 \uC88B\uC544\uD558\uB294 \uC591\uC2DD\uC774\uC5D0\uC694."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uC2DD\uB2F9\xB7\uCE58\uD0A8\uC9D1",
        description: "\uD640+\uBC30\uB2EC\uC774 \uB3D9\uC2DC\uC5D0 \uC774\uB904\uC9C0\uB294 \uBCF5\uD569 \uC5C5\uC885",
        benefits: ["\uBC30\uB2EC\uC571 4\uAC1C \uD1B5\uD569 \uC5F0\uB3D9", "\uC8FC\uBC29 \uC790\uB3D9 \uC624\uB354", "\uD14C\uC774\uBE14\uBCC4 \uB9E4\uCD9C \uAD00\uB9AC"]
      },
      {
        industry: "\uCE74\uD398\xB7\uBCA0\uC774\uCEE4\uB9AC",
        description: "\uBE60\uB978 \uC8FC\uBB38 \uD68C\uC804\uACFC \uC7AC\uACE0 \uAD00\uB9AC\uAC00 \uC911\uC694",
        benefits: ["\uC6D0\uC7AC\uB8CC \uC790\uB3D9 \uCC28\uAC10", "\uD3EC\uC7A5 \uC120\uACB0\uC81C", "\uBA64\uBC84\uC2ED \uC5F0\uB3D9"]
      },
      {
        industry: "\uD504\uB79C\uCC28\uC774\uC988",
        description: "\uB2E4\uC810\uD3EC \uD1B5\uD569 \uAD00\uB9AC\uAC00 \uD544\uC218",
        benefits: ["\uBCF8\uC0AC \uC2E4\uC2DC\uAC04 \uB9E4\uCD9C \uBAA8\uB2C8\uD130\uB9C1", "\uAC00\uB9F9\uC810 \uC815\uC0B0 \uC790\uB3D9\uD654", "\uBA54\uB274 \uC77C\uAD04 \uC5C5\uB370\uC774\uD2B8"]
      }
    ],
    relatedProducts: ["\uCE74\uB4DC\uB2E8\uB9D0\uAE30", "\uD0A4\uC624\uC2A4\uD06C", "\uD14C\uC774\uBE14\uC624\uB354"]
  },
  {
    slug: "CCTV\uC124\uCE58",
    name: "CCTV \uC124\uCE58",
    nameEn: "CCTV Installation",
    icon: "\u{1F4F9}",
    tagline: "4K \uD654\uC9C8\xB7\uC57C\uAC04\xB7\uBAA8\uBC14\uC77C",
    description: "4K \uACE0\uD654\uC9C8\uB85C \uB9E4\uC7A5 \uAD6C\uC11D\uAD6C\uC11D \uC2E4\uC2DC\uAC04 \uBAA8\uB2C8\uD130\uB9C1. \uB3C4\uB09C \uBC29\uC9C0\uBD80\uD130 \uD654\uC7AC \uAC10\uC9C0\uAE4C\uC9C0 \uD1B5\uD569 \uBCF4\uC548.",
    metaCount: "6\uAC00\uC9C0 \uCE74\uBA54\uB77C",
    features: [
      "4K UHD \uCD08\uACE0\uD654\uC9C8",
      "\uC57C\uAC04 \uC801\uC678\uC120 \uCD2C\uC601",
      "\uC2A4\uB9C8\uD2B8\uD3F0 \uC2E4\uC2DC\uAC04 \uD655\uC778",
      "\uB3D9\uC791\xB7\uD654\uC7AC \uAC10\uC9C0 \uC54C\uB9BC",
      "\uD074\uB77C\uC6B0\uB4DC 30\uC77C \uC800\uC7A5",
      "\uCD9C\uC785 \uD1B5\uC81C \uC2DC\uC2A4\uD15C"
    ],
    useCases: [
      "\uB3C4\uB09C\xB7\uBD84\uC2E4 \uC190\uD574 90% \uC608\uBC29",
      "\uD654\uC7AC\uBCF4\uD5D8 \uD560\uC778 \uCD5C\uB300 20%",
      "\uC9C1\uC6D0\xB7\uACE0\uAC1D \uC548\uC804 \uAD00\uB9AC"
    ],
    specifications: {
      title: "\uCE74\uBA54\uB77C \uC0AC\uC591",
      items: [
        { label: "\uD574\uC0C1\uB3C4", value: "4K UHD (3840\xD72160) \xB7 800\uB9CC \uD654\uC18C" },
        { label: "\uC57C\uAC04 \uCD2C\uC601", value: "\uC801\uC678\uC120 30m \xB7 \uCEEC\uB7EC \uC57C\uAC04 \uBAA8\uB4DC \uC9C0\uC6D0" },
        { label: "\uC800\uC7A5 \uBC29\uC2DD", value: "\uB85C\uCEEC NVR 3TB + \uD074\uB77C\uC6B0\uB4DC 30\uC77C \uC774\uC911 \uC800\uC7A5" },
        { label: "AI \uAC10\uC9C0", value: "\uB3D9\uC791\xB7\uC5BC\uAD74\xB7\uCE68\uC785\xB7\uD654\uC7AC\xB7\uC5F0\uAE30 \uC790\uB3D9 \uAC10\uC9C0" },
        { label: "\uBAA8\uBC14\uC77C \uC571", value: "iOS/Android \uC2E4\uC2DC\uAC04 \uB77C\uC774\uBE0C\xB7\uC54C\uB9BC" },
        { label: "\uBC29\uC218\xB7\uBC29\uC9C4", value: "IP67 \uB4F1\uAE09 \xB7 \uC2E4\uB0B4\uC678 \uD1B5\uD569 \uC124\uCE58 \uAC00\uB2A5" }
      ]
    },
    costSavings: {
      title: "\uBCF4\uC548 \uD6A8\uACFC \uBC0F \uD560\uC778",
      items: [
        { metric: "\uB3C4\uB09C \uBC29\uC9C0", amount: "\uC6D4 100\uB9CC\uC6D0", description: "\uC7AC\uACE0 \uC190\uC2E4\xB7\uC9C1\uC6D0 \uBD80\uC815 90% \uC608\uBC29, \uBCF4\uD5D8 \uCCAD\uAD6C \uAC04\uC18C\uD654" },
        { metric: "\uD654\uC7AC\uBCF4\uD5D8 \uD560\uC778", amount: "\uC5F0 60\uB9CC\uC6D0", description: "\uC5F0\uAE30\xB7\uD654\uC7AC \uAC10\uC9C0 \uC2DC\uC2A4\uD15C\uC73C\uB85C \uBCF4\uD5D8\uB8CC \uCD5C\uB300 20% \uD560\uC778" },
        { metric: "\uBD84\uC7C1 \uD574\uACB0", amount: "\uC6D4 50\uB9CC\uC6D0", description: "\uACE0\uAC1D \uBD84\uC7C1\xB7\uC9C1\uC6D0 \uBB38\uC81C \uBC1C\uC0DD \uC2DC \uC99D\uAC70 \uC601\uC0C1\uC73C\uB85C \uC989\uC2DC \uD574\uACB0" }
      ]
    },
    installationCases: [
      {
        title: "\uC774\uD0DC\uC6D0 \uBC14",
        location: "\uC11C\uC6B8 \uC6A9\uC0B0\uAD6C \uC774\uD0DC\uC6D0\uB3D9",
        businessType: "\uC2EC\uC57C \uC601\uC5C5 \uBC14 (\uC0C8\uBCBD 4\uC2DC\uAE4C\uC9C0)",
        challenge: "\uCDE8\uAC1D \uB09C\uB3D9, \uB3C4\uB09C \uC0AC\uACE0 \uBE48\uBC1C, \uC9C1\uC6D0 \uC548\uC804 \uC6B0\uB824",
        solution: "4K \uCE74\uBA54\uB77C 8\uB300 + \uB3D9\uC791 \uAC10\uC9C0 + \uACBD\uCC30\uC11C \uC790\uB3D9 \uC5F0\uB3D9",
        result: "\uC0AC\uAC74\xB7\uC0AC\uACE0 80% \uAC10\uC18C, \uC9C1\uC6D0 \uC548\uC804 \uD655\uBCF4, \uBCF4\uD5D8\uB8CC \uC6D4 15\uB9CC\uC6D0 \uC808\uC57D"
      },
      {
        title: "\uD310\uAD50 IT \uCE74\uD398",
        location: "\uACBD\uAE30 \uC131\uB0A8\uC2DC \uBD84\uB2F9\uAD6C",
        businessType: "IT\uAE30\uC5C5 \uB2E8\uC9C0 \uB300\uD615 \uCE74\uD398",
        challenge: "\uACE0\uAC00 \uB178\uD2B8\uBD81\xB7\uD0DC\uBE14\uB9BF \uB3C4\uB09C \uC6B0\uB824, 24\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601 \uC900\uBE44",
        solution: "\uACE0\uD574\uC0C1\uB3C4 6\uB300 + \uC5BC\uAD74 \uC778\uC2DD + \uCD9C\uC785 \uD1B5\uC81C + \uD074\uB77C\uC6B0\uB4DC \uC800\uC7A5",
        result: "\uB3C4\uB09C \uC0AC\uACE0 \uC644\uC804 \uCC28\uB2E8, 24\uC2DC\uAC04 \uBB34\uC778 \uC6B4\uC601 \uC131\uACF5, \uC2E0\uB8B0\uB3C4 \uD5A5\uC0C1"
      }
    ],
    faq: [
      {
        question: "\uAC1C\uC778\uC815\uBCF4\uBCF4\uD638\uBC95 \uAD00\uB828\uD574\uC11C \uBB38\uC81C\uC5C6\uB098\uC694?",
        answer: "\uBC95\uC801\uC73C\uB85C \uD544\uC218\uC778 CCTV \uC548\uB0B4\uD310 \uC124\uCE58\uC640 \uB179\uD654 \uBAA9\uC801 \uACE0\uC9C0\uAE4C\uC9C0 \uBAA8\uB450 \uD574\uB4DC\uB824\uC694. \uAC1C\uC778\uC815\uBCF4\uBCF4\uD638\uC704\uC6D0\uD68C \uAE30\uC900 100% \uC900\uC218\uD574\uC694."
      },
      {
        question: "\uB179\uD654\uB41C \uC601\uC0C1\uC740 \uC5B4\uB5BB\uAC8C \uD655\uC778\uD558\uB098\uC694?",
        answer: "\uC2A4\uB9C8\uD2B8\uD3F0 \uC571\uC5D0\uC11C \uC2E4\uC2DC\uAC04 + \uACFC\uAC70 \uC601\uC0C1\uC744 \uBAA8\uB450 \uD655\uC778 \uAC00\uB2A5\uD574\uC694. \uD2B9\uC815 \uC2DC\uAC04\xB7\uB3D9\uC791 \uAC10\uC9C0 \uC21C\uAC04\uB9CC \uBE60\uB974\uAC8C \uCC3E\uC744 \uC218 \uC788\uC5B4\uC694."
      },
      {
        question: "\uC815\uC804\uC774 \uB418\uBA74 \uB179\uD654\uAC00 \uBA48\uCD94\uB098\uC694?",
        answer: "\uBB34\uC815\uC804 \uC804\uC6D0\uC7A5\uCE58(UPS) \uAE30\uBCF8 \uC81C\uACF5\uC73C\uB85C \uC815\uC804 \uC2DC\uC5D0\uB3C4 2\uC2DC\uAC04 \uB179\uD654 \uC9C0\uC18D\uB3FC\uC694. \uC911\uC694 \uC21C\uAC04\uC744 \uB193\uCE58\uC9C0 \uC54A\uB3C4\uB85D \uBCF4\uC7A5\uD574\uC694."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uC2EC\uC57C \uC5C5\uC885",
        description: "\uCDE8\uAC1D\xB7\uB3C4\uB09C \uC704\uD5D8\uC774 \uB192\uC740 \uC5C5\uC885",
        benefits: ["\uACE0\uD574\uC0C1\uB3C4 \uC57C\uAC04 \uCD2C\uC601", "\uB3D9\uC791 \uAC10\uC9C0 \uC54C\uB9BC", "\uACBD\uCC30\uC11C \uC5F0\uB3D9"]
      },
      {
        industry: "\uACE0\uAC00\uD488 \uD310\uB9E4\uC810",
        description: "\uB3C4\uB09C \uC190\uC2E4 \uC608\uBC29\uC774 \uC911\uC694",
        benefits: ["4K \uC5BC\uAD74 \uC778\uC2DD", "\uCD9C\uC785 \uD1B5\uC81C", "\uBCF4\uD5D8 \uD560\uC778 \uD61C\uD0DD"]
      },
      {
        industry: "\uBB34\uC778 \uB9E4\uC7A5",
        description: "\uC6D0\uACA9 \uAD00\uB9AC\uAC00 \uD575\uC2EC",
        benefits: ["24\uC2DC\uAC04 \uBAA8\uB2C8\uD130\uB9C1", "\uCE68\uC785 \uC989\uC2DC \uC54C\uB9BC", "\uB9E4\uCD9C\xB7\uC7AC\uACE0 \uD655\uC778"]
      }
    ],
    relatedProducts: ["\uC778\uD130\uB137\uC124\uCE58", "\uD3EC\uC2A4\uAE30", "\uD0A4\uC624\uC2A4\uD06C"]
  }
];
function findProduct(slug) {
  return products.find((p) => p.slug === slug);
}

// src/components/sections/Regions.tsx
var Regions = () => {
  return /* @__PURE__ */ jsxDEV("section", { class: "regions", id: "regions", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "FIND YOUR SOLUTION" }),
      /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
        "\uC6B0\uB9AC \uB9E4\uC7A5\uC5D0 \uD544\uC694\uD55C",
        /* @__PURE__ */ jsxDEV("br", {}),
        /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC124\uBE44\uB97C \uCC3E\uC544\uBCF4\uC138\uC694" })
      ] }),
      /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC9C0\uC5ED \xB7 \uC81C\uD488 \xB7 \uC0C1\uB2F4\uAE4C\uC9C0 \uD55C \uBC88\uC5D0 \uD655\uC778\uD558\uC138\uC694" }),
      /* @__PURE__ */ jsxDEV("div", { class: "solution-tabs", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "solution-tab active",
            "data-panel": "region",
            onclick: "switchSolutionTab('region')",
            children: "\uC9C0\uC5ED\uBCC4 \uC124\uCE58"
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "solution-tab",
            "data-panel": "product",
            onclick: "switchSolutionTab('product')",
            children: "\uC81C\uD488\uBCC4 \uC548\uB0B4"
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "solution-tab",
            "data-panel": "consult",
            onclick: "switchSolutionTab('consult')",
            children: "\uACAC\uC801 \uC0C1\uB2F4"
          }
        )
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "solution-panel active", id: "solution-panel-region", children: /* @__PURE__ */ jsxDEV("div", { class: "solution-grid", children: regions.map((r) => /* @__PURE__ */ jsxDEV("a", { href: `/${r.nameKoShort}`, class: "solution-pill", children: r.nameKoShort })) }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "solution-panel", id: "solution-panel-product", children: /* @__PURE__ */ jsxDEV("div", { class: "solution-grid product-grid", children: products.map((p) => /* @__PURE__ */ jsxDEV("a", { href: `/\uC81C\uD488/${p.slug}`, class: "solution-pill", children: p.name })) }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "solution-panel", id: "solution-panel-consult", children: /* @__PURE__ */ jsxDEV("div", { class: "consult-box", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "consult-phone", children: "010-9677-2356" }),
        /* @__PURE__ */ jsxDEV("div", { class: "consult-msg", children: "\uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uC9C1\uC811 \uC751\uB300\uD569\uB2C8\uB2E4" }),
        /* @__PURE__ */ jsxDEV("div", { class: "consult-btns", children: [
          /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "consult-btn consult-btn-primary", children: "\uC804\uD654 \uC0C1\uB2F4 \uBC14\uB85C \uAC78\uAE30" }),
          /* @__PURE__ */ jsxDEV("a", { href: "sms:01096772356", class: "consult-btn consult-btn-sms", children: "\uBB38\uC790 \uBA54\uC2DC\uC9C0 \uBCF4\uB0B4\uAE30" }),
          /* @__PURE__ */ jsxDEV("a", { href: "#contact", class: "consult-btn consult-btn-secondary", children: "\uC0C1\uB2F4 \uD3FC \uC791\uC131\uD558\uAE30" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "consult-info", children: [
          "365\uC77C \uC5F0\uC911\uBB34\uD734 \uC0C1\uB2F4",
          /* @__PURE__ */ jsxDEV("br", {}),
          "\uBB38\uC790\xB7\uC0C1\uB2F4\uD3FC\uC740 24\uC2DC\uAC04 \uC811\uC218 \uAC00\uB2A5"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxDEV("script", { dangerouslySetInnerHTML: {
      __html: `
          function switchSolutionTab(name) {
            document.querySelectorAll('.solution-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.solution-panel').forEach(p => p.classList.remove('active'));
            document.querySelector('[data-panel="' + name + '"]').classList.add('active');
            document.getElementById('solution-panel-' + name).classList.add('active');
          }
        `
    } })
  ] });
};

// src/components/sections/HomeFAQ.tsx
var faqs = [
  {
    q: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30\xB7\uD3EC\uC2A4\uAE30\xB7\uD0A4\uC624\uC2A4\uD06C \uC678\uC5D0 \uB2E4\uB978 \uAC83\uB3C4 \uC124\uCE58\uD558\uB098\uC694?",
    a: "\uB124. \uC778\uD130\uB137 \uC124\uCE58, CCTV, \uC790\uD310\uAE30, \uAC74\uCD95 \uCCA0\uAC70\xB7\uC778\uD14C\uB9AC\uC5B4\uAE4C\uC9C0 \uB9E4\uC7A5 \uC624\uD508\uC5D0 \uD544\uC694\uD55C \uAC70\uC758 \uBAA8\uB4E0 \uC124\uBE44\uB97C \uCC98\uB9AC\uD569\uB2C8\uB2E4. \uD55C \uBC88\uC758 \uC0C1\uB2F4\uC73C\uB85C \uD544\uC694\uD55C \uC7A5\uBE44 \uC804\uBD80\uC5D0 \uB300\uD574 \uACAC\uC801\uC744 \uBC1B\uC73C\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  {
    q: "\uC124\uCE58 \uBE44\uC6A9\uC740 \uC5BC\uB9C8\uC778\uAC00\uC694?",
    a: "\uC7A5\uBE44 \uC885\uB958\xB7\uB9E4\uC7A5 \uADDC\uBAA8\xB7\uC57D\uC815 \uC870\uAC74\uC5D0 \uB530\uB77C \uB2E4\uB985\uB2C8\uB2E4. \uB2E8\uB9D0\uAE30\uB294 \uBB34\uC57D\uC815/\uC57D\uC815\uC5D0 \uB530\uB77C \uCD08\uAE30 \uBE44\uC6A9 \uC5C6\uC774 \uB3C4\uC785 \uAC00\uB2A5\uD558\uACE0, \uD3EC\uC2A4\uAE30\xB7\uD0A4\uC624\uC2A4\uD06C\uB294 30~350\uB9CC\uC6D0 \uC120\uC785\uB2C8\uB2E4. \uC815\uD655\uD55C \uACAC\uC801\uC740 \uC0C1\uB2F4 \uD6C4 \uC548\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4."
  },
  {
    q: "\uC124\uCE58 \uAE30\uAC04\uC740 \uC5BC\uB9C8\uB098 \uAC78\uB9AC\uB098\uC694?",
    a: "\uB2E8\uC21C \uB2E8\uB9D0\uAE30\uB294 \uC2E0\uCCAD \uD6C4 2~3\uC77C, \uD3EC\uC2A4\uAE30\xB7\uD0A4\uC624\uC2A4\uD06C\uB294 \uB9E4\uC7A5 \uC810\uAC80 \uD6C4 3~7\uC77C \uB0B4 \uC124\uCE58 \uC644\uB8CC\uB429\uB2C8\uB2E4. \uC778\uD130\uB137\xB7CCTV\uB294 \uD1B5\uC2E0\uC0AC \uC77C\uC815\uC5D0 \uB530\uB77C 1~2\uC8FC \uC18C\uC694\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  {
    q: "\uC804\uAD6D \uC5B4\uB514\uB4E0 \uC124\uCE58 \uAC00\uB2A5\uD55C\uAC00\uC694?",
    a: "\uC11C\uC6B8\xB7\uACBD\uAE30\xB7\uC778\uCC9C\uC744 \uD3EC\uD568\uD574 \uC804\uAD6D 17\uAC1C \uC2DC\xB7\uB3C4 \uBAA8\uB450 \uCD9C\uC7A5 \uC124\uCE58 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uBCC4\uB3C4\uC758 \uCD9C\uC7A5\uBE44 \uC5C6\uC774 \uACAC\uC801 \uC548\uC5D0 \uD3EC\uD568\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4."
  },
  {
    q: "\uC124\uCE58 \uD6C4 \uBB38\uC81C\uAC00 \uC0DD\uAE30\uBA74 \uC5B4\uB5BB\uAC8C \uD558\uB098\uC694?",
    a: "365\uC77C \uC0C1\uB2F4 \uAC00\uB2A5\uD558\uBA70, \uB2E8\uC21C \uC18C\uD504\uD2B8\uC6E8\uC5B4 \uC624\uB958\uB294 \uC6D0\uACA9 \uC9C0\uC6D0\uC73C\uB85C \uC989\uC2DC \uD574\uACB0\uD569\uB2C8\uB2E4. \uD558\uB4DC\uC6E8\uC5B4 \uBB38\uC81C\uB294 \uCD9C\uC7A5 AS\uB85C \uBE60\uB974\uAC8C \uB300\uC751\uD558\uACE0, \uBCF4\uC99D \uAE30\uAC04 \uB3D9\uC548 \uBB34\uC0C1 \uCC98\uB9AC\uB429\uB2C8\uB2E4."
  },
  {
    q: "\uC57D\uC815 \uC5C6\uC774 \uC0AC\uC6A9\uD560 \uC218 \uC788\uB098\uC694?",
    a: "\uAC00\uB2A5\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uC57D\uC815 \uC870\uAC74\uC5D0 \uB530\uB77C \uB2E8\uB9D0\uAE30 \uBB34\uB8CC \uC124\uCE58 \uB4F1 \uD61C\uD0DD\uC774 \uB2EC\uB77C\uC9C0\uBBC0\uB85C, \uB9E4\uC7A5 \uC6B4\uC601 \uACC4\uD68D\uC5D0 \uB9DE\uCDB0 \uAC00\uC7A5 \uC720\uB9AC\uD55C \uC870\uAC74\uC744 \uD568\uAED8 \uBE44\uAD50\uD574 \uB4DC\uB9BD\uB2C8\uB2E4."
  }
];
var HomeFAQ = () => /* @__PURE__ */ jsxDEV("section", { class: "home-faq", id: "faq", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "FAQ" }),
  /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
    "\uC790\uC8FC \uBB3B\uB294 ",
    /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC9C8\uBB38." })
  ] }),
  /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC0C1\uB2F4 \uC804\uC5D0 \uAD81\uAE08\uD558\uC2E4\uB9CC\uD55C \uB0B4\uC6A9\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4." }),
  /* @__PURE__ */ jsxDEV("div", { class: "home-faq-list faq-list", children: faqs.map((item, idx) => /* @__PURE__ */ jsxDEV("details", { class: "faq-item", children: [
    /* @__PURE__ */ jsxDEV("summary", { class: "faq-q", children: [
      /* @__PURE__ */ jsxDEV("span", { class: "faq-num", children: String(idx + 1).padStart(2, "0") }),
      /* @__PURE__ */ jsxDEV("span", { class: "faq-q-text", children: item.q }),
      /* @__PURE__ */ jsxDEV("span", { class: "faq-icon", children: "+" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "faq-a", children: item.a })
  ] })) })
] }) });

// src/utils/variance.ts
function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = h * 33 ^ s.charCodeAt(i);
  }
  return Math.abs(h >>> 0);
}
function pickOne(items, seed, salt = 0) {
  if (items.length === 0)
    throw new Error("Empty array");
  const idx = hashString(seed + ":" + salt) % items.length;
  return items[idx];
}
function pickMany(items, count, seed) {
  const n = Math.min(count, items.length);
  const shuffled = [...items];
  const hash = hashString(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (hash + i * 2654435761) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}
function seededInt(seed, salt, min, max) {
  const h = hashString(seed + ":" + salt);
  return min + h % (max - min);
}
function fillTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

// src/data/testimonials.ts
var testimonialPool = [
  {
    tag: "\uB9E4\uCD9C 40% \u2191",
    stars: 5,
    text: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 \uAD50\uCCB4 \uD6C4\n\uCE74\uB4DC\uB9E4\uCD9C\uC774 \uAE09\uC99D\uD588\uC5B4\uC694",
    body: "VAN\uC0AC \uC218\uC218\uB8CC\uAE4C\uC9C0 \uBE44\uAD50\uD574\uC8FC\uC154\uC11C \uC5F0\uAC04 60\uB9CC\uC6D0 \uC808\uC57D. \uB2E8\uB9D0\uAE30 \uC18D\uB3C4\uB3C4 \uBE68\uB77C\uC838\uC11C \uD53C\uD06C \uD0C0\uC784 \uD68C\uC804\uC728\uC774 \uB208\uC5D0 \uB744\uAC8C \uC88B\uC544\uC84C\uC2B5\uB2C8\uB2E4.",
    authorName: "\uAC15\uB0A8\uAD6C \uCE74\uD398 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC11C\uC6B8",
    regionEn: "SEOUL"
  },
  {
    tag: "\uC778\uAC74\uBE44 50% \u2193",
    stars: 5,
    text: "\uD0A4\uC624\uC2A4\uD06C \uC124\uCE58 \uD6C4\n\uD640 \uC778\uAC74\uBE44\uAC00 \uBC18\uC73C\uB85C",
    body: "\uD14C\uC774\uBE14\uC624\uB354 + \uD0A4\uC624\uC2A4\uD06C \uC870\uD569\uC73C\uB85C \uD640 \uC9C1\uC6D0 2\uBA85\uC5D0\uC11C 1\uBA85\uC73C\uB85C. \uC11C\uBE44\uC2A4 \uD488\uC9C8\uC740 \uADF8\uB300\uB85C\uC778\uB370 \uB9C8\uC9C4\uC774 \uD655 \uAC1C\uC120\uB410\uC2B5\uB2C8\uB2E4.",
    authorName: "\uC218\uC6D0\uC2DC \uC74C\uC2DD\uC810 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uACBD\uAE30",
    regionEn: "GYEONGGI"
  },
  {
    tag: "\uBB34\uC778\uD654 \uC131\uACF5",
    stars: 5,
    text: "24\uC2DC\uAC04 \uBB34\uC778\uB9E4\uC7A5\n\uC804\uD658\uC774 \uAC00\uB2A5\uD588\uC2B5\uB2C8\uB2E4",
    body: "CCTV + \uBB34\uC778\uACB0\uC81C + \uC6D0\uACA9 \uBAA8\uB2C8\uD130\uB9C1\uAE4C\uC9C0 \uD55C\uBC88\uC5D0. \uC0C8\uBCBD \uC2DC\uAC04 \uB9E4\uCD9C\uC774 \uC804\uCCB4\uC758 30%\uB97C \uCC28\uC9C0\uD560 \uC815\uB3C4\uB85C \uD6A8\uACFC\uAC00 \uCEF8\uC2B5\uB2C8\uB2E4.",
    authorName: "\uC5F0\uC218\uAD6C \uC2A4\uD130\uB514\uCE74\uD398 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC778\uCC9C",
    regionEn: "INCHEON"
  },
  {
    tag: "\uC2E0\uC18D \uB300\uC751",
    stars: 5,
    text: "\uC804\uD654 \uD55C \uD1B5\uC5D0\n\uBE60\uB978 \uCD9C\uB3D9",
    body: "\uC624\uD508 \uC804\uB0A0 \uB2E8\uB9D0\uAE30 \uBB38\uC81C \uC0DD\uACBC\uB294\uB370 \uC2E0\uC18D\uD558\uAC8C \uCD9C\uB3D9\uD574\uC8FC\uC168\uC2B5\uB2C8\uB2E4. \uB355\uBD84\uC5D0 \uC624\uD508\uC77C \uC601\uC5C5 \uCC28\uC9C8 \uC5C6\uC5C8\uC5B4\uC694.",
    authorName: "\uB9C8\uD3EC\uAD6C \uBCA0\uC774\uCEE4\uB9AC \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC11C\uC6B8",
    regionEn: "SEOUL"
  },
  {
    tag: "\uC218\uC218\uB8CC \uC808\uAC10",
    stars: 5,
    text: "VAN\uC0AC \uBE44\uAD50 \uD6C4\n\uC5F0 48\uB9CC\uC6D0 \uC808\uC57D",
    body: "\uAE30\uC874\uC5D0 \uC4F0\uB358 \uB2E8\uB9D0\uAE30 \uC218\uC218\uB8CC\uAC00 \uBE44\uC2F8\uB2E4\uB294 \uAC78 \uC774\uBC88 \uACAC\uC801 \uBE44\uAD50\uB85C \uC54C\uC558\uC5B4\uC694. \uAD50\uCCB4\uB9CC \uD588\uB294\uB370 \uC6D4 4\uB9CC\uC6D0\uC529 \uC808\uC57D\uB429\uB2C8\uB2E4.",
    authorName: "\uC131\uB0A8\uC2DC \uC74C\uC2DD\uC810 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uACBD\uAE30",
    regionEn: "GYEONGGI"
  },
  {
    tag: "\uC7AC\uACE0 \uC790\uB3D9\uD654",
    stars: 5,
    text: "\uBE75 \uC7AC\uACE0 \uAD00\uB9AC\n\uC790\uB3D9\uC73C\uB85C \uB429\uB2C8\uB2E4",
    body: "\uD310\uB9E4\uB418\uB294 \uC989\uC2DC \uC7AC\uACE0 \uCC28\uAC10\uB418\uACE0, \uBD80\uC871\uD55C \uD488\uBAA9 \uC54C\uB9BC\uAE4C\uC9C0 \uC640\uC694. \uD3D0\uAE30\uC728\uB3C4 20% \uC904\uC5C8\uC2B5\uB2C8\uB2E4.",
    authorName: "\uACE0\uC591\uC2DC \uBCA0\uC774\uCEE4\uB9AC \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uACBD\uAE30",
    regionEn: "GYEONGGI"
  },
  {
    tag: "\uBC30\uB2EC \uD1B5\uD569",
    stars: 5,
    text: "\uBC30\uB2EC\uC571 3\uC0AC\n\uC8FC\uBB38\uC774 \uD55C \uD654\uBA74\uC5D0",
    body: "\uBC30\uBBFC\xB7\uCFE0\uD321\uC774\uCE20\xB7\uC694\uAE30\uC694\uB97C \uB530\uB85C \uD655\uC778\uD558\uB358 \uAC78 \uD558\uB098\uB85C \uD1B5\uD569. \uC8FC\uBB38 \uB204\uB77D 0\uAC74\uC774 \uB410\uC2B5\uB2C8\uB2E4.",
    authorName: "\uC740\uD3C9\uAD6C \uCE58\uD0A8\uC9D1 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC11C\uC6B8",
    regionEn: "SEOUL"
  },
  {
    tag: "\uC608\uC57D \uAD00\uB9AC",
    stars: 5,
    text: "\uC608\uC57D\uACFC \uACB0\uC81C\uAC00\n\uD55C\uBC88\uC5D0 \uB05D\uB0A9\uB2C8\uB2E4",
    body: "\uC608\uC57D \uC190\uB2D8 \uBC1B\uACE0 \uACB0\uC81C\uAE4C\uC9C0 POS \uD558\uB098\uB85C \uD574\uACB0. \uC608\uC57D \uC7A5\uBD80 \uC190\uC73C\uB85C \uAD00\uB9AC\uD558\uB358 \uC2DC\uC808\uC740 \uB05D\uB0AC\uC5B4\uC694.",
    authorName: "\uC6A9\uC778\uC2DC \uBBF8\uC6A9\uC2E4 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uACBD\uAE30",
    regionEn: "GYEONGGI"
  },
  {
    tag: "\uD53C\uD06C \uD0C0\uC784",
    stars: 5,
    text: "\uC810\uC2EC \uD68C\uC804\uC728\n\uB208\uC5D0 \uB744\uAC8C \uAC1C\uC120",
    body: "\uD0A4\uC624\uC2A4\uD06C 2\uB300 \uC124\uCE58 \uD6C4 \uC810\uC2EC \uD53C\uD06C \uB300\uAE30\uC904\uC774 \uC5C6\uC5B4\uC84C\uC5B4\uC694. \uAC1D\uB2E8\uAC00\uB3C4 \uC624\uD788\uB824 \uB354 \uC62C\uB790\uC2B5\uB2C8\uB2E4.",
    authorName: "\uC11C\uCD08\uAD6C \uBD84\uC2DD\uC9D1 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC11C\uC6B8",
    regionEn: "SEOUL"
  },
  {
    tag: "\uC138\uBB34 \uD3B8\uC758",
    stars: 5,
    text: "\uC138\uBB34\uC0AC\uD55C\uD14C\n\uC5D1\uC140 \uD55C \uC7A5\uC774\uBA74 \uB05D",
    body: "\uC6D4\uBCC4 \uB9E4\uCD9C \uB9AC\uD3EC\uD2B8 \uC790\uB3D9 \uC0DD\uC131\uB418\uB2C8\uAE4C \uC138\uBB34\uC0AC\uC5D0\uAC8C \uADF8\uB300\uB85C \uB118\uACA8\uC90D\uB2C8\uB2E4. \uBE44\uC6A9 \uCC98\uB9AC\uAC00 \uD6E8\uC52C \uD3B8\uD574\uC84C\uC5B4\uC694.",
    authorName: "\uC1A1\uD30C\uAD6C \uCE74\uD398 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC11C\uC6B8",
    regionEn: "SEOUL"
  },
  {
    tag: "\uD68C\uC6D0\uAD8C \uAD00\uB9AC",
    stars: 5,
    text: "PT \uD68C\uC6D0\uAD8C\uC774\n\uD55C \uD654\uBA74\uC5D0 \uC815\uB9AC",
    body: "\uD68C\uC6D0\uBCC4 \uC794\uC5EC \uC138\uC158, \uACB0\uC81C \uC774\uB825\uC774 \uD55C \uB208\uC5D0 \uBCF4\uC5EC\uC694. \uC7A5\uBD80 \uD5F7\uAC08\uB9B4 \uC77C\uC774 \uC5C6\uC5B4\uC84C\uC2B5\uB2C8\uB2E4.",
    authorName: "\uBD80\uCC9C\uC2DC \uD53C\uD2B8\uB2C8\uC2A4 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uACBD\uAE30",
    regionEn: "GYEONGGI"
  },
  {
    tag: "\uC6D0\uACA9 \uC9C0\uC6D0",
    stars: 5,
    text: "\uC7A5\uC560 \uBC1C\uC0DD\uD574\uB3C4\n10\uBD84 \uB9CC\uC5D0 \uD574\uACB0",
    body: "\uC800\uB141 \uC601\uC5C5 \uC911 \uD3EC\uC2A4\uAC00 \uBA48\uCDC4\uB294\uB370 \uC804\uD654 \uD55C \uD1B5\uC5D0 \uC6D0\uACA9 \uC9C0\uC6D0. 10\uBD84 \uB9CC\uC5D0 \uB2E4\uC2DC \uC601\uC5C5 \uC7AC\uAC1C\uD588\uC2B5\uB2C8\uB2E4.",
    authorName: "\uB0A8\uB3D9\uAD6C \uC74C\uC2DD\uC810 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC778\uCC9C",
    regionEn: "INCHEON"
  },
  {
    tag: "\uC218\uAC15\uB8CC \uAD00\uB9AC",
    stars: 5,
    text: "\uD559\uC6D0 \uC218\uAC15\uB8CC\n\uBBF8\uB0A9 0\uAC74 \uB2EC\uC131",
    body: "\uC218\uAC15\uB8CC \uC790\uB3D9 \uC815\uC0B0\uACFC \uBBF8\uB0A9 \uC54C\uB9BC \uAE30\uB2A5\uC73C\uB85C \uC218\uAC15\uB8CC \uBBF8\uB0A9\uB960\uC774 0%\uAC00 \uB410\uC2B5\uB2C8\uB2E4.",
    authorName: "\uB178\uC6D0\uAD6C \uD559\uC6D0 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC11C\uC6B8",
    regionEn: "SEOUL"
  },
  {
    tag: "\uACF5\uAC04 \uC808\uC57D",
    stars: 5,
    text: "1\uD3C9 \uB9E4\uC7A5\uC5D0\uB3C4\n\uB531 \uB9DE\uB294 \uD06C\uAE30",
    body: "\uAC00\uAC8C\uAC00 \uC6CC\uB099 \uC881\uC544\uC11C \uAC71\uC815\uD588\uB294\uB370 \uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C\uAC00 \uB531 \uB9DE\uC544\uC694. \uCD94\uAC00 \uACF5\uAC04 \uD544\uC694 \uC5C6\uC774 \uC124\uCE58 \uC644\uB8CC.",
    authorName: "\uAD00\uC545\uAD6C \uBD84\uC2DD\uC9D1 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uC11C\uC6B8",
    regionEn: "SEOUL"
  },
  {
    tag: "\uC2E0\uC18D A/S",
    stars: 5,
    text: "\uC6D0\uACA9 \uC9C0\uC6D0\uACFC\n\uD604\uC7A5 \uBC29\uBB38 \uBAA8\uB450",
    body: "\uD0A4\uC624\uC2A4\uD06C\uC5D0 \uBB38\uC81C \uC0DD\uACA8\uC11C \uC5F0\uB77D\uB4DC\uB838\uB294\uB370 \uB2E4\uC74C \uB0A0 \uC624\uC804\uC5D0 \uBC14\uB85C \uC624\uC154\uC11C \uAD50\uCCB4\uAE4C\uC9C0 \uD574\uC8FC\uC168\uC5B4\uC694.",
    authorName: "\uC548\uC591\uC2DC \uC74C\uC2DD\uC810 \uC0AC\uC7A5\uB2D8",
    authorRegion: "\uACBD\uAE30",
    regionEn: "GYEONGGI"
  }
];
var testimonials = [
  { ...testimonialPool[0], featured: false },
  { ...testimonialPool[1], featured: true },
  { ...testimonialPool[2], featured: false }
];

// src/components/sections/MainSections.tsx
var Process = () => /* @__PURE__ */ jsxDEV("section", { class: "process", id: "process", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "HOW IT WORKS" }),
  /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
    "\uC0C1\uB2F4\uBD80\uD130 \uC124\uCE58\uAE4C\uC9C0 ",
    /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "4\uB2E8\uACC4." })
  ] }),
  /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uBCF5\uC7A1\uD55C \uC808\uCC28 \uC5C6\uC774, \uC804\uD654 \uD55C \uD1B5\uC774\uBA74 \uC2DC\uC791\uB429\uB2C8\uB2E4." }),
  /* @__PURE__ */ jsxDEV("div", { class: "process-steps", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "process-step", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "step-num", children: "STEP 01" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-title", children: "\uBB34\uB8CC \uC0C1\uB2F4" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-desc", children: "\uC5C5\uC885\xB7\uB9E4\uC7A5 \uADDC\uBAA8\xB7\uD544\uC694 \uC7A5\uBE44\uB97C \uB4E3\uACE0 \uCD5C\uC801 \uAD6C\uC131\uC744 \uC81C\uC548\uD569\uB2C8\uB2E4." }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-time", children: "10\uBD84 \uC774\uB0B4" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "process-step", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "step-num", children: "STEP 02" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-title", children: "\uACAC\uC801 \uD655\uC815" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-desc", children: "VAN\uC0AC\xB7\uC7A5\uBE44\xB7\uC218\uC218\uB8CC\uB97C \uBE44\uAD50\uD55C \uD22C\uBA85\uD55C \uACAC\uC801\uC744 \uB4DC\uB9BD\uB2C8\uB2E4." }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-time", children: "\uC0C1\uB2F4 \uD6C4 \uBC1C\uC1A1" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "process-step", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "step-num", children: "STEP 03" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-title", children: "\uD604\uC7A5 \uC124\uCE58" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-desc", children: "\uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uB9E4\uC7A5\uC744 \uC9C1\uC811 \uBC29\uBB38\uD574 \uC138\uD305\uAE4C\uC9C0 \uC644\uB8CC\uD569\uB2C8\uB2E4." }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-time", children: "\uC77C\uC815 \uD611\uC758" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "process-step", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "step-num", children: "STEP 04" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-title", children: "A/S \uC9C0\uC6D0" }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-desc", children: "\uC6D0\uACA9 \uC9C0\uC6D0\uACFC \uD604\uC7A5 \uBC29\uBB38\uC73C\uB85C \uC2E0\uC18D \uB300\uC751." }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-time", children: "365\uC77C" })
    ] })
  ] })
] }) });
var CTA = () => /* @__PURE__ */ jsxDEV("section", { class: "cta-section", id: "contact", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("div", { class: "cta-inner", children: [
  /* @__PURE__ */ jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDEV("h2", { children: [
      "\uC9C0\uAE08 \uC804\uD654 \uD55C \uD1B5\uC774\uBA74",
      /* @__PURE__ */ jsxDEV("br", {}),
      "\uBE60\uB974\uAC8C \uC2DC\uC791\uB429\uB2C8\uB2E4."
    ] }),
    /* @__PURE__ */ jsxDEV("p", { children: [
      "\uC5B4\uB5A4 \uC7A5\uBE44\uAC00 \uD544\uC694\uD55C\uC9C0 \uBAA8\uB974\uC154\uB3C4 \uAD1C\uCC2E\uC2B5\uB2C8\uB2E4.",
      /* @__PURE__ */ jsxDEV("br", {}),
      "\uC5C5\uC885\uACFC \uB9E4\uC7A5 \uADDC\uBAA8\uB9CC \uB9D0\uC500\uD574 \uC8FC\uC2DC\uBA74, \uB9DE\uCDA4 \uAD6C\uC131\uC744 \uC81C\uC548\uD574 \uB4DC\uB9BD\uB2C8\uB2E4."
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "cta-phone", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "cta-phone-label", children: "FREE CONSULTATION" }),
    /* @__PURE__ */ jsxDEV("div", { class: "cta-phone-num", children: "010-9677-2356" }),
    /* @__PURE__ */ jsxDEV("div", { class: "cta-phone-hours", children: "365\uC77C \uC5F0\uC911\uBB34\uD734 \uC0C1\uB2F4" })
  ] })
] }) }) });

// src/pages/HomePage.tsx
var HomePage = () => /* @__PURE__ */ jsxDEV(
  Layout,
  {
    meta: {
      title: "\uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4 \xB7 \uB9E4\uC7A5\uC5D0 \uD544\uC694\uD55C \uBAA8\uB4E0 \uC7A5\uBE44\uB97C \uD55C\uBC88\uC5D0",
      description: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 \xB7 \uD3EC\uC2A4\uAE30 \xB7 \uD0A4\uC624\uC2A4\uD06C\uBD80\uD130 \uC778\uD130\uB137 \xB7 CCTV \xB7 \uC778\uD14C\uB9AC\uC5B4\uAE4C\uC9C0. \uC804\uAD6D 17\uAC1C \uC2DC\xB7\uB3C4 \uC804\uBB38 \uB9E4\uB2C8\uC800 \uCD9C\uC7A5 \uC124\uCE58. \uBB34\uB8CC \uACAC\uC801 \uC0C1\uB2F4.",
      canonical: "https://thesavestore.com/"
    },
    children: [
      /* @__PURE__ */ jsxDEV(Navigation, {}),
      /* @__PURE__ */ jsxDEV("main", { children: [
        /* @__PURE__ */ jsxDEV(Hero, {}),
        /* @__PURE__ */ jsxDEV(CoreProducts, {}),
        /* @__PURE__ */ jsxDEV(InstallGallery, {}),
        /* @__PURE__ */ jsxDEV(InstallReviews, {}),
        /* @__PURE__ */ jsxDEV(WhyUs, {}),
        /* @__PURE__ */ jsxDEV(MidCTA, {}),
        /* @__PURE__ */ jsxDEV(Industries, {}),
        /* @__PURE__ */ jsxDEV(Regions, {}),
        /* @__PURE__ */ jsxDEV(Process, {}),
        /* @__PURE__ */ jsxDEV(HomeFAQ, {}),
        /* @__PURE__ */ jsxDEV(CTA, {})
      ] }),
      /* @__PURE__ */ jsxDEV(Footer, {}),
      /* @__PURE__ */ jsxDEV(FloatingPhone, {})
    ]
  }
);

// src/components/Breadcrumb.tsx
var SITE_BASE = "https://thesavestore.com";
var Breadcrumb = ({ items }) => {
  const itemListElement = items.map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.name,
    ...item.url ? { item: item.url.startsWith("http") ? item.url : `${SITE_BASE}${item.url}` } : {}
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement
  };
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("nav", { class: "breadcrumb", "aria-label": "\uD604\uC7AC \uC704\uCE58", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("ol", { children: items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return /* @__PURE__ */ jsxDEV("li", { children: item.url && !isLast ? /* @__PURE__ */ jsxDEV("a", { href: item.url, children: item.name }) : /* @__PURE__ */ jsxDEV("span", { "aria-current": "page", children: item.name }) });
    }) }) }) }),
    /* @__PURE__ */ jsxDEV(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) }
      }
    )
  ] });
};

// src/pages/ProductPage.tsx
var ProductPage = ({ product }) => {
  const title2 = `${product.name} \uC124\uCE58 \xB7 \uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4`;
  const description = `${product.name} \xB7 ${product.tagline}. \uC804\uAD6D \uC804\uBB38 \uB9E4\uB2C8\uC800 \uCD9C\uC7A5 \uC124\uCE58. ${product.description}`;
  return /* @__PURE__ */ jsxDEV(
    Layout,
    {
      meta: {
        title: title2,
        description,
        canonical: `https://thesavestore.com/\uC81C\uD488/${product.slug}`
      },
      children: [
        /* @__PURE__ */ jsxDEV(Navigation, {}),
        /* @__PURE__ */ jsxDEV(
          Breadcrumb,
          {
            items: [
              { name: "\uD648", url: "/" },
              { name: "\uC81C\uD488", url: "/#products" },
              { name: product.name }
            ]
          }
        ),
        /* @__PURE__ */ jsxDEV("section", { class: "page-header", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: [
              "PRODUCT \xB7 ",
              String(product.slug)
            ] }),
            /* @__PURE__ */ jsxDEV(
              "h1",
              {
                style: "font-size: clamp(40px, 5vw, 68px); font-weight: 900; letter-spacing: -0.05em; line-height: 1.05; margin-bottom: 20px; color: var(--black);",
                children: [
                  product.name,
                  /* @__PURE__ */ jsxDEV("br", {}),
                  /* @__PURE__ */ jsxDEV("span", { style: "color: var(--orange);", children: [
                    product.tagline,
                    "."
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "p",
              {
                style: "font-size: 17px; color: var(--muted); line-height: 1.7; max-width: 560px; font-weight: 300; margin-bottom: 32px;",
                children: product.description
              }
            ),
            /* @__PURE__ */ jsxDEV("div", { class: "hero-ctas", children: [
              /* @__PURE__ */ jsxDEV("a", { href: "/#contact", class: "btn btn-primary", children: "\uBB34\uB8CC \uACAC\uC801 \uBC1B\uAE30 \u2192" }),
              /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "btn btn-outline", children: "\u{1F4DE} 010-9677-2356" })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              style: "width: 180px; height: 180px; background: var(--brown); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 80px; flex-shrink: 0;",
              children: product.icon
            }
          )
        ] }) }) }),
        product.features && product.features.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--white);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "KEY FEATURES" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "\uC120\uD0DD\uD560 \uC218 \uC788\uB294 ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: [
              product.metaCount,
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uB9E4\uC7A5 \uADDC\uBAA8\uC640 \uC6B4\uC601 \uBC29\uC2DD\uC5D0 \uB530\uB77C \uCD5C\uC801\uC758 \uC635\uC158\uC744 \uC81C\uC548\uD569\uB2C8\uB2E4." }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;", children: product.features.map((feature, idx) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              style: "background: var(--white); border: 0.5px solid var(--line); border-radius: 16px; padding: 28px 24px;",
              children: [
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 12px; color: var(--orange); letter-spacing: 0.22em; font-weight: 700; margin-bottom: 16px;",
                    children: String(idx + 1).padStart(2, "0")
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    style: "font-size: 16px; font-weight: 800; letter-spacing: -0.03em; color: var(--black);",
                    children: feature
                  }
                )
              ]
            }
          )) })
        ] }) }),
        product.useCases && product.useCases.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--ivory);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "USE CASES" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "\uC2E4\uC81C\uB85C ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC774\uB807\uAC8C \uC4F0\uC785\uB2C8\uB2E4." })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 40px;", children: product.useCases.map((uc) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              style: "background: var(--white); border-radius: 16px; padding: 32px 28px; display: flex; gap: 16px; align-items: start;",
              children: [
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    style: "width: 28px; height: 28px; background: var(--orange); color: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 800; font-size: 14px;",
                    children: "\u2713"
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    style: "font-size: 15px; line-height: 1.6; color: var(--black); font-weight: 500; letter-spacing: -0.02em;",
                    children: uc
                  }
                )
              ]
            }
          )) })
        ] }) }),
        product.specifications && /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--brown); color: var(--white);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", style: "color: var(--orange);", children: "SPECIFICATIONS" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", style: "color: var(--white);", children: [
            "\uC815\uD655\uD55C ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", style: "color: var(--orange);", children: [
              product.specifications.title,
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", style: "color: rgba(255,255,255,0.7);", children: "\uAC80\uC99D\uB41C \uAE30\uC220\uB825\uACFC \uC548\uC815\uC131\uC73C\uB85C \uB9E4\uC7A5 \uC6B4\uC601\uC744 \uC9C0\uC6D0\uD569\uB2C8\uB2E4." }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 40px;", children: product.specifications.items.map((spec) => /* @__PURE__ */ jsxDEV("div", { style: "background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 24px;", children: [
            /* @__PURE__ */ jsxDEV("div", { style: "font-size: 13px; color: var(--orange); font-weight: 600; margin-bottom: 8px; letter-spacing: 0.05em;", children: spec.label }),
            /* @__PURE__ */ jsxDEV("div", { style: "font-size: 15px; color: var(--white); font-weight: 500; line-height: 1.4;", children: spec.value })
          ] })) })
        ] }) }),
        product.costSavings && /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--orange); color: var(--white);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", style: "color: rgba(255,255,255,0.8);", children: "COST SAVINGS" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", style: "color: var(--white);", children: [
            "\uD655\uC2E4\uD55C ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", style: "color: var(--white); text-shadow: 0 0 20px rgba(255,255,255,0.3);", children: [
              product.costSavings.title,
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 40px;", children: product.costSavings.items.map((cost) => /* @__PURE__ */ jsxDEV("div", { style: "background: rgba(255,255,255,0.1); border-radius: 12px; padding: 32px 28px; text-align: center;", children: [
            /* @__PURE__ */ jsxDEV("div", { style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 32px; font-weight: 700; color: var(--white); margin-bottom: 8px;", children: cost.amount }),
            /* @__PURE__ */ jsxDEV("div", { style: "font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 12px;", children: cost.metric }),
            /* @__PURE__ */ jsxDEV("div", { style: "font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.5;", children: cost.description })
          ] })) })
        ] }) }),
        product.faq && product.faq.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--ivory);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "FAQ" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "\uC790\uC8FC \uBB3B\uB294 ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC9C8\uBB38." })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; gap: 16px; margin-top: 40px; max-width: 800px;", children: product.faq.map((faq) => /* @__PURE__ */ jsxDEV("details", { style: "background: var(--white); border-radius: 8px; padding: 24px; border: 0.5px solid var(--line);", children: [
            /* @__PURE__ */ jsxDEV("summary", { style: "font-size: 16px; font-weight: 700; color: var(--black); cursor: pointer; margin-bottom: 16px;", children: faq.question }),
            /* @__PURE__ */ jsxDEV("div", { style: "font-size: 14px; color: var(--muted); line-height: 1.6;", children: faq.answer })
          ] })) })
        ] }) }),
        /* @__PURE__ */ jsxDEV(Process, {}),
        /* @__PURE__ */ jsxDEV(Industries, {}),
        /* @__PURE__ */ jsxDEV(Regions, {}),
        /* @__PURE__ */ jsxDEV(CTA, {}),
        /* @__PURE__ */ jsxDEV(Footer, {}),
        /* @__PURE__ */ jsxDEV(FloatingPhone, {})
      ]
    }
  );
};

// src/pages/IndustryPage.tsx
var IndustryPage = ({ industry }) => {
  const title2 = `${industry.name} \uC7A5\uBE44 \uC124\uCE58 \xB7 \uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4`;
  const description = `${industry.name} \uB9DE\uCDA4 POS \xB7 \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \xB7 \uD0A4\uC624\uC2A4\uD06C \uAD6C\uC131 \uCD94\uCC9C. \uC804\uAD6D \uC804\uBB38 \uCD9C\uC7A5 \uC124\uCE58.`;
  const recommendedProducts = industry.recommendedProducts.map((slug) => products.find((p) => p.slug === slug)).filter((p) => p !== void 0);
  return /* @__PURE__ */ jsxDEV(
    Layout,
    {
      meta: {
        title: title2,
        description,
        canonical: `https://thesavestore.com/\uC5C5\uC885/${industry.slug}`
      },
      children: [
        /* @__PURE__ */ jsxDEV(Navigation, {}),
        /* @__PURE__ */ jsxDEV(
          Breadcrumb,
          {
            items: [
              { name: "\uD648", url: "/" },
              { name: "\uC5C5\uC885", url: "/#industries" },
              { name: industry.name }
            ]
          }
        ),
        /* @__PURE__ */ jsxDEV("section", { class: "page-header", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "INDUSTRY" }),
            /* @__PURE__ */ jsxDEV(
              "h1",
              {
                style: "font-size: clamp(40px, 5vw, 68px); font-weight: 900; letter-spacing: -0.05em; line-height: 1.05; margin-bottom: 20px; color: var(--black);",
                children: [
                  industry.name,
                  "\uC744 \uC704\uD55C",
                  /* @__PURE__ */ jsxDEV("br", {}),
                  /* @__PURE__ */ jsxDEV("span", { style: "color: var(--orange);", children: "\uB9DE\uCDA4 \uC7A5\uBE44 \uAD6C\uC131." })
                ]
              }
            ),
            industry.description && /* @__PURE__ */ jsxDEV(
              "p",
              {
                style: "font-size: 17px; color: var(--muted); line-height: 1.7; max-width: 560px; font-weight: 300; margin-bottom: 32px;",
                children: industry.description
              }
            ),
            /* @__PURE__ */ jsxDEV("div", { class: "hero-ctas", children: [
              /* @__PURE__ */ jsxDEV("a", { href: "/#contact", class: "btn btn-primary", children: "\uBB34\uB8CC \uACAC\uC801 \uBC1B\uAE30 \u2192" }),
              /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "btn btn-outline", children: "\u{1F4DE} 010-9677-2356" })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              style: "width: 180px; height: 180px; background: var(--orange-tint); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 80px; flex-shrink: 0;",
              children: industry.icon
            }
          )
        ] }) }) }),
        industry.commonIssues && industry.commonIssues.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 80px 0; background: var(--white);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "COMMON ISSUES" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            industry.name,
            " ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC0AC\uC7A5\uB2D8\uB4E4\uC758 \uACE0\uBBFC." })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 40px;", children: industry.commonIssues.map((issue) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              style: "background: var(--white); border: 0.5px solid var(--line); border-radius: 16px; padding: 28px 24px;",
              children: /* @__PURE__ */ jsxDEV(
                "div",
                {
                  style: "font-size: 16px; font-weight: 700; color: var(--black); letter-spacing: -0.025em;",
                  children: issue
                }
              )
            }
          )) })
        ] }) }),
        industry.marketStats && /* @__PURE__ */ jsxDEV("section", { style: "padding: 80px 0; background: var(--ivory); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "MARKET OVERVIEW" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "2026\uB144 ",
            industry.name,
            " ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC2DC\uC7A5 \uD604\uD669." })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC5C5\uACC4 \uB370\uC774\uD130\uB97C \uBC14\uD0D5\uC73C\uB85C \uC9C0\uAE08 \uC5B4\uB5A4 \uC7A5\uBE44\uAC00 \uD544\uC694\uD55C\uC9C0 \uD310\uB2E8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }),
          /* @__PURE__ */ jsxDEV("div", { class: "industry-stats-grid", children: [industry.marketStats.stat1, industry.marketStats.stat2, industry.marketStats.stat3].map((s) => /* @__PURE__ */ jsxDEV("div", { style: "background: var(--white); border-radius: 20px; padding: 36px 28px; text-align: center;", children: [
            /* @__PURE__ */ jsxDEV("div", { style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(36px, 4.5vw, 52px); font-weight: 800; letter-spacing: -0.04em; color: var(--orange); line-height: 1; margin-bottom: 12px;", children: s.value }),
            /* @__PURE__ */ jsxDEV("div", { style: "font-size: 15px; font-weight: 700; color: var(--black); letter-spacing: -0.03em; margin-bottom: 4px;", children: s.label }),
            /* @__PURE__ */ jsxDEV("div", { style: "font-size: 12px; color: var(--muted); font-weight: 400;", children: s.sub })
          ] })) })
        ] }) }),
        industry.installRecord && /* @__PURE__ */ jsxDEV("section", { style: "padding: 80px 0; background: var(--brown); color: var(--white); position: relative; overflow: hidden;", children: [
          /* @__PURE__ */ jsxDEV("div", { style: "position: absolute; top: -60px; right: -60px; width: 280px; height: 280px; background: radial-gradient(circle, var(--orange) 0%, transparent 60%); opacity: 0.2; pointer-events: none;" }),
          /* @__PURE__ */ jsxDEV("div", { class: "container", style: "position: relative;", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "sec-label", style: "color: var(--orange);", children: /* @__PURE__ */ jsxDEV("span", { style: "display: inline-flex; align-items: center; gap: 12px;", children: [
              /* @__PURE__ */ jsxDEV("span", { style: "width: 28px; height: 2px; background: var(--orange);" }),
              "INSTALL RECORD"
            ] }) }),
            /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", style: "color: var(--white);", children: [
              "\uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4\uC758",
              /* @__PURE__ */ jsxDEV("br", {}),
              industry.name,
              " ",
              /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC124\uCE58 \uC2E4\uC801." })
            ] }),
            /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", style: "color: rgba(255,255,255,0.65);", children: [
              "\uC804\uAD6D ",
              industry.name,
              " \uB9E4\uC7A5\uC5D0 \uC313\uC778 \uB178\uD558\uC6B0\uB97C \uBC14\uD0D5\uC73C\uB85C \uCD5C\uC801\uC758 \uAD6C\uC131\uC744 \uCD94\uCC9C\uD569\uB2C8\uB2E4."
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "industry-record-grid", children: [
              /* @__PURE__ */ jsxDEV("div", { style: "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 32px 24px;", children: [
                /* @__PURE__ */ jsxDEV("div", { style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.18em; color: var(--orange); font-weight: 700; margin-bottom: 12px;", children: "TOTAL" }),
                /* @__PURE__ */ jsxDEV("div", { style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(32px, 4vw, 44px); font-weight: 800; letter-spacing: -0.04em; color: var(--white); line-height: 1; margin-bottom: 10px;", children: [
                  industry.installRecord.totalCount,
                  /* @__PURE__ */ jsxDEV("span", { style: "font-size: 0.5em; color: var(--orange); margin-left: 4px;", children: "\uAC74" })
                ] }),
                /* @__PURE__ */ jsxDEV("div", { style: "font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5;", children: [
                  "\uB204\uC801 ",
                  industry.name,
                  " \uC124\uCE58 \uAC74\uC218"
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { style: "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 32px 24px;", children: [
                /* @__PURE__ */ jsxDEV("div", { style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.18em; color: var(--orange); font-weight: 700; margin-bottom: 12px;", children: "THIS MONTH" }),
                /* @__PURE__ */ jsxDEV("div", { style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(32px, 4vw, 44px); font-weight: 800; letter-spacing: -0.04em; color: var(--white); line-height: 1; margin-bottom: 10px;", children: [
                  industry.installRecord.recentMonthCount,
                  /* @__PURE__ */ jsxDEV("span", { style: "font-size: 0.5em; color: var(--orange); margin-left: 4px;", children: "\uAC74" })
                ] }),
                /* @__PURE__ */ jsxDEV("div", { style: "font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5;", children: "\uC774\uBC88 \uB2EC \uC124\uCE58 \uAC74\uC218" })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { style: "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 32px 24px;", children: [
                /* @__PURE__ */ jsxDEV("div", { style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.18em; color: var(--orange); font-weight: 700; margin-bottom: 12px;", children: "POPULAR" }),
                /* @__PURE__ */ jsxDEV("div", { style: "font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: var(--white); line-height: 1.3; margin-bottom: 10px; margin-top: 8px;", children: industry.installRecord.popularSetup }),
                /* @__PURE__ */ jsxDEV("div", { style: "font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5;", children: "\uAC00\uC7A5 \uB9CE\uC774 \uC124\uCE58\uB41C \uAD6C\uC131" })
              ] })
            ] })
          ] })
        ] }),
        industry.successTips && industry.successTips.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 90px 0; background: var(--white); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "SUCCESS TIPS" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            industry.name,
            " \uC0AC\uC7A5\uB2D8\uC774 \uAF2D \uC544\uC154\uC57C \uD560",
            /* @__PURE__ */ jsxDEV("br", {}),
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC131\uACF5 \uD301 3\uAC00\uC9C0." })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uD604\uC7A5\uC5D0\uC11C \uC218\uCC9C \uAC74\uC758 \uC124\uCE58\uB97C \uC9C4\uD589\uD558\uBA70 \uC313\uC778 \uC2E4\uC804 \uB178\uD558\uC6B0\uC785\uB2C8\uB2E4." }),
          /* @__PURE__ */ jsxDEV("div", { class: "success-tips-grid", children: industry.successTips.map((tip) => /* @__PURE__ */ jsxDEV("div", { class: "success-tip-card", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "success-tip-num", children: tip.number }),
            /* @__PURE__ */ jsxDEV("div", { class: "success-tip-title", children: tip.title }),
            /* @__PURE__ */ jsxDEV("div", { class: "success-tip-desc", children: tip.desc })
          ] })) })
        ] }) }),
        industry.packages && industry.packages.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 90px 0; background: var(--ivory); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "PACKAGES" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "\uADDC\uBAA8\uC5D0 \uB9DE\uB294 ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uB9DE\uCDA4 \uD328\uD0A4\uC9C0." })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uB9E4\uC7A5 \uD06C\uAE30\uC640 \uC6B4\uC601 \uBC29\uC2DD\uC5D0 \uB530\uB77C 3\uB2E8\uACC4\uB85C \uC81C\uC548\uB4DC\uB9BD\uB2C8\uB2E4." }),
          /* @__PURE__ */ jsxDEV("div", { class: "industry-packages-grid", children: industry.packages.map((pkg) => /* @__PURE__ */ jsxDEV("div", { class: `package-card ${pkg.popular ? "popular" : ""}`, children: [
            pkg.popular && /* @__PURE__ */ jsxDEV("div", { class: "package-badge", children: "POPULAR" }),
            /* @__PURE__ */ jsxDEV("div", { class: "package-tier", children: pkg.tier.toUpperCase() }),
            /* @__PURE__ */ jsxDEV("div", { class: "package-name", children: pkg.name }),
            /* @__PURE__ */ jsxDEV("div", { class: "package-target", children: pkg.target }),
            /* @__PURE__ */ jsxDEV("ul", { class: "package-items", children: pkg.items.map((item) => /* @__PURE__ */ jsxDEV("li", { children: item })) }),
            /* @__PURE__ */ jsxDEV("div", { class: "package-cost", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "package-cost-row", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "package-cost-label", children: "\uCD08\uAE30" }),
                /* @__PURE__ */ jsxDEV("span", { class: "package-cost-value", children: pkg.initialCost })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "package-cost-row", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "package-cost-label", children: "\uC6D4" }),
                /* @__PURE__ */ jsxDEV("span", { class: "package-cost-value emph", children: pkg.monthlyCost })
              ] })
            ] })
          ] })) })
        ] }) }),
        industry.warnings && industry.warnings.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 90px 0; background: var(--white); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "WATCH OUT" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "\uC774\uAC83\uB9CC\uC740 ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uD53C\uD558\uC138\uC694." })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: [
            industry.name,
            " \uC7A5\uBE44 \uB3C4\uC785 \uC2DC \uAC00\uC7A5 \uB9CE\uC774 \uD558\uB294 \uC2E4\uC218\uB4E4."
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "warnings-grid", children: industry.warnings.map((w) => /* @__PURE__ */ jsxDEV("div", { class: "warning-card", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "warning-icon", children: "\u26A0\uFE0F" }),
            /* @__PURE__ */ jsxDEV("div", { class: "warning-content", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "warning-title", children: w.title }),
              /* @__PURE__ */ jsxDEV("div", { class: "warning-desc", children: w.desc })
            ] })
          ] })) })
        ] }) }),
        industry.faq && industry.faq.length > 0 && /* @__PURE__ */ jsxDEV("section", { style: "padding: 90px 0; background: var(--ivory); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "FAQ" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "\uC790\uC8FC \uBB3B\uB294 ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC9C8\uBB38." })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: [
            industry.name,
            " \uC7A5\uBE44 \uC124\uCE58 \uC2DC \uAC00\uC7A5 \uB9CE\uC774 \uBB38\uC758\uB418\uB294 \uC9C8\uBB38\uB4E4\uC785\uB2C8\uB2E4."
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "faq-list", children: industry.faq.map((item, idx) => /* @__PURE__ */ jsxDEV("details", { class: "faq-item", children: [
            /* @__PURE__ */ jsxDEV("summary", { class: "faq-q", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "faq-num", children: String(idx + 1).padStart(2, "0") }),
              /* @__PURE__ */ jsxDEV("span", { class: "faq-q-text", children: item.q }),
              /* @__PURE__ */ jsxDEV("span", { class: "faq-icon", children: "+" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "faq-a", children: item.a })
          ] })) })
        ] }) }),
        /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--ivory);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "RECOMMENDED SETUP" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            "\uCD94\uCC9C \uC7A5\uBE44 ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: [
              recommendedProducts.length,
              "\uC885."
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: [
            industry.name,
            " \uC6B4\uC601\uC5D0 \uAF2D \uD544\uC694\uD55C \uC7A5\uBE44\uB97C \uC5C4\uC120\uD588\uC2B5\uB2C8\uB2E4."
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "product-grid", children: recommendedProducts.map((p, idx) => /* @__PURE__ */ jsxDEV("a", { href: `/\uC81C\uD488/${p.slug}`, class: "product-card", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "product-num", children: String(idx + 1).padStart(2, "0") }),
            /* @__PURE__ */ jsxDEV("div", { class: "product-icon", children: p.icon }),
            /* @__PURE__ */ jsxDEV("div", { class: "product-name", children: p.name }),
            /* @__PURE__ */ jsxDEV("div", { class: "product-desc", children: p.description }),
            /* @__PURE__ */ jsxDEV("div", { class: "product-foot", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "product-meta", children: p.metaCount }),
              /* @__PURE__ */ jsxDEV("span", { class: "product-arrow", children: "\u2192" })
            ] })
          ] })) })
        ] }) }),
        /* @__PURE__ */ jsxDEV(Regions, {}),
        /* @__PURE__ */ jsxDEV(Process, {}),
        /* @__PURE__ */ jsxDEV(CTA, {}),
        /* @__PURE__ */ jsxDEV(Footer, {}),
        /* @__PURE__ */ jsxDEV(FloatingPhone, {})
      ]
    }
  );
};

// src/utils/copyBank.ts
var heroHeadlines_dong = [
  "{location} \uB9E4\uC7A5,\n\uC124\uBE44 \uD55C\uBC88\uC5D0.",
  "{location}\uC758 \uC0AC\uC7A5\uB2D8,\n\uC7A5\uBE44 \uAC71\uC815 \uC5C6\uC774.",
  "{location}\uC5D0\uC11C \uC7A5\uC0AC \uC2DC\uC791\uD558\uC168\uB2E4\uBA74.",
  "{location} \uC804\uC6A9\n\uCD9C\uC7A5 \uC124\uCE58.",
  "{location} \uC0AC\uC7A5\uB2D8 \uC804\uB2F4\uD300.",
  "{location} \uB9E4\uC7A5\uB3C4\n\uC804\uBB38 \uC124\uCE58.",
  "{location}\uAE4C\uC9C0 30\uBD84.\n\uBC14\uB85C \uC124\uCE58.",
  "{location} \uCC3D\uC5C5 \uC900\uBE44,\n\uC124\uBE44\uBD80\uD130 \uCC59\uAE30\uC138\uC694.",
  "{location} \uB3D9\uB124 \uC7A5\uC0AC,\n\uC6B0\uB9AC\uAC00 \uB3D5\uC2B5\uB2C8\uB2E4.",
  "{location} \uC0C1\uAD8C\uC5D0 \uB9DE\uCD98\n\uCD5C\uC801 \uC7A5\uBE44 \uAD6C\uC131.",
  "{location},\n\uCC3E\uC544\uAC00\uB294 \uC124\uCE58\uD300.",
  "{location}\uC5D0 \uB531 \uB9DE\uB294\n\uC7A5\uBE44 \uD55C \uC138\uD2B8.",
  "{location} \uC790\uC601\uC5C5\uC790\uB97C \uC704\uD55C\n\uC62C\uC778\uC6D0 \uC194\uB8E8\uC158.",
  "{location}\uC5D0\uC11C\uB3C4\n\uD504\uB9AC\uBBF8\uC5C4 \uC7A5\uBE44.",
  "{location} \uB9E4\uC7A5 \uC624\uD508\n\uC774\uC81C \uC2DC\uC791\uD558\uC138\uC694.",
  "{location} \uC601\uC5C5 \uC2DC\uC791,\n\uC624\uB298\uBD80\uD130 \uAC00\uB2A5.",
  "{location} \uC0AC\uC7A5\uB2D8\uB4E4\uC758\n\uC120\uD0DD\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.",
  "{location} \uAC70\uB9AC\n\uAC00\uC7A5 \uBE60\uB978 \uC124\uCE58\uD300.",
  "{location} 1\uD638\uC810,\n\uC800\uD76C\uAC00 \uB9E1\uACA0\uC2B5\uB2C8\uB2E4.",
  "{location}\uC758 \uB9E4\uC7A5 \uAC1C\uC5C5,\n\uC804\uBB38\uAC00\uC640 \uD568\uAED8."
];
var heroHeadlines_district = [
  "{location}\n\uC804\uC9C0\uC5ED \uCD9C\uC7A5.",
  "{location} \uC804\uBB38\n\uC124\uCE58 \uC11C\uBE44\uC2A4.",
  "{location} \uC0AC\uC7A5\uB2D8\uC744 \uC704\uD55C\n\uC6D0\uC2A4\uD1B1 \uC194\uB8E8\uC158.",
  "{location} \uB9E4\uC7A5,\n\uC124\uBE44 \uD30C\uD2B8\uB108.",
  "{location} \uC804\uB2F4\n\uB9E4\uB2C8\uC800\uD300 \uC6B4\uC601.",
  "{location}\uC758\n\uC124\uBE44 \uD30C\uD2B8\uB108.",
  "{location} \uACF3\uACF3,\n\uC804\uBB38 \uBC29\uBB38 \uAC00\uB2A5.",
  "{location} \uC0C1\uAD8C \uC804\uCCB4\n\uCEE4\uBC84.",
  "{location} 1\uD638\uC810\uBD80\uD130\n\uD504\uB79C\uCC28\uC774\uC988\uAE4C\uC9C0.",
  "{location} \uC804 \uB3D9 \uCD9C\uC7A5\n\uC124\uCE58 \uC644\uB8CC."
];
var heroSubcopy_dong = [
  "{location} \uC9C0\uC5ED \uB9E4\uC7A5\uC744 \uC704\uD55C \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \xB7 \uD3EC\uC2A4\uAE30 \xB7 \uD0A4\uC624\uC2A4\uD06C \uCD9C\uC7A5 \uC124\uCE58. \uC804\uD654 \uD55C \uD1B5\uC774\uBA74 \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uBC29\uBB38\uD569\uB2C8\uB2E4.",
  "{location}\uC5D0\uC11C \uC7A5\uC0AC\uB97C \uC2DC\uC791\uD558\uC168\uB2E4\uBA74, \uBCF5\uC7A1\uD55C \uC7A5\uBE44 \uC138\uD305\uC740 \uC800\uD76C\uC5D0\uAC8C. \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uC9C1\uC811 \uBC29\uBB38\uD574 \uC138\uD305\uAE4C\uC9C0 \uB05D\uB0C5\uB2C8\uB2E4.",
  "{location} \uC0C1\uAD8C \uD2B9\uC131\uC744 \uC54C\uACE0 \uC788\uB294 \uB9E4\uB2C8\uC800\uAC00 \uB9E4\uC7A5 \uADDC\uBAA8\uC5D0 \uB9DE\uCDB0 \uCD5C\uC801 \uAD6C\uC131\uC744 \uC81C\uC548\uD569\uB2C8\uB2E4.",
  "{location}\uC758 \uC0AC\uC7A5\uB2D8\uB4E4\uC774 \uC120\uD0DD\uD55C \uC124\uCE58 \uD30C\uD2B8\uB108. \uCE74\uB4DC\uB2E8\uB9D0\uAE30\uBD80\uD130 \uD0A4\uC624\uC2A4\uD06C\uAE4C\uC9C0 \uD55C\uBC88\uC5D0.",
  "{location}\uAE4C\uC9C0 \uC804\uBB38 \uB9E4\uB2C8\uC800 \uCD9C\uC7A5 \uC124\uCE58. \uC77C\uC815\uC740 \uC0C1\uB2F4 \uD6C4 \uD611\uC758\uD569\uB2C8\uB2E4.",
  "{location}\uC5D0\uC11C\uB3C4 \uC7A5\uBE44 \uAC71\uC815 \uC5C6\uC774 \uC601\uC5C5\uC744 \uC2DC\uC791\uD558\uC138\uC694. \uC218\uC218\uB8CC\xB7\uC138\uD305\xB7A/S \uBAA8\uB450 \uD3EC\uD568."
];
var heroSubcopy_district = [
  "{location} \uC804\uC9C0\uC5ED\uC744 \uCEE4\uBC84\uD558\uB294 \uCD9C\uC7A5 \uC124\uCE58\uD300. \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uB9E4\uC7A5\uC744 \uBC29\uBB38\uD569\uB2C8\uB2E4.",
  "{location}\uC758 \uC218\uB9CE\uC740 \uB9E4\uC7A5\uC5D0 \uC124\uCE58\uD55C \uACBD\uD5D8\uC744 \uBC14\uD0D5\uC73C\uB85C, \uC9C0\uC5ED \uC0C1\uAD8C\uC5D0 \uB9DE\uB294 \uAD6C\uC131\uC744 \uC81C\uC548\uD569\uB2C8\uB2E4.",
  "{location} \uC804\uB2F4 \uB9E4\uB2C8\uC800\uAC00 \uC0C1\uC8FC\uD574 \uBE60\uB978 A/S\uAC00 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uC6D0\uACA9 \uC9C0\uC6D0\uACFC \uD604\uC7A5 \uBC29\uBB38\uC73C\uB85C \uC2E0\uC18D \uB300\uC751\uD569\uB2C8\uB2E4.",
  "{location}\uC5D0\uC11C \uD65C\uB3D9\uD558\uB294 \uB9E4\uC7A5 \uC0AC\uC7A5\uB2D8\uB4E4\uC774 \uAC00\uC7A5 \uB9CE\uC774 \uC120\uD0DD\uD55C \uC124\uCE58 \uD30C\uD2B8\uB108."
];
var faqPool = [
  {
    q: "{location}\uAE4C\uC9C0 \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uBC29\uBB38\uD558\uB098\uC694?",
    a: "\uB124, \uC0C1\uB2F4 \uC644\uB8CC \uD6C4 \uC77C\uC815\uC744 \uD611\uC758\uD558\uC5EC \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uBC29\uBB38\uD569\uB2C8\uB2E4. {location} \uC9C0\uC5ED\uC740 \uC804\uB2F4 \uB9E4\uB2C8\uC800\uAC00 \uC0C1\uC8FC\uD558\uC5EC \uBE60\uB978 \uB300\uC751\uC744 \uBCF4\uC7A5\uD569\uB2C8\uB2E4."
  },
  {
    q: "{location} \uB9E4\uC7A5 \uADDC\uBAA8\uAC00 \uC791\uC544\uB3C4 \uC124\uCE58 \uAC00\uB2A5\uD55C\uAC00\uC694?",
    a: "1\uD3C9 \uC774\uD558 \uC18C\uD615 \uB9E4\uC7A5\uBD80\uD130 \uC124\uCE58\uD574\uC654\uC2B5\uB2C8\uB2E4. \uACF5\uAC04\uC5D0 \uB9DE\uCD98 \uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C\xB7\uC18C\uD615 POS \uC635\uC158\uB3C4 \uC900\uBE44\uB418\uC5B4 \uC788\uC5B4\uC694."
  },
  {
    q: "{location}\uC5D0\uC11C \uAE30\uC874 \uB2E8\uB9D0\uAE30 \uAD50\uCCB4\uD558\uBA74 \uC218\uC218\uB8CC\uB294?",
    a: "VAN\uC0AC \uC218\uC218\uB8CC\uB97C \uBE44\uAD50\uD558\uC5EC \uAC00\uC7A5 \uC720\uB9AC\uD55C \uC870\uAC74\uC73C\uB85C \uC548\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4. \uB300\uBD80\uBD84 \uAE30\uC874 \uB300\uBE44 \uC5F0 30~60\uB9CC\uC6D0 \uC808\uC57D \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    q: "{location} \uC0AC\uC5C5\uC7A5\uC5D0 24\uC2DC\uAC04 A/S\uAC00 \uB418\uB098\uC694?",
    a: "\uC6D0\uACA9 \uC9C0\uC6D0\uC73C\uB85C \uB300\uBD80\uBD84 \uBB38\uC81C\uAC00 \uBE60\uB974\uAC8C \uD574\uACB0\uB418\uBA70, \uD544\uC694 \uC2DC \uD604\uC7A5 \uBC29\uBB38\uB3C4 \uAC00\uB2A5\uD569\uB2C8\uB2E4. {location} \uC9C0\uC5ED\uC740 \uB9E4\uB2C8\uC800 \uC0C1\uC8FC\uB85C \uB354 \uBE60\uB974\uAC8C \uB300\uC751\uD569\uB2C8\uB2E4."
  },
  {
    q: "{location} \uC9C0\uC5ED\uC5D0 \uC124\uCE58 \uC2E4\uC801\uC774 \uC5BC\uB9C8\uB098 \uB418\uB098\uC694?",
    a: "\uCD5C\uADFC 3\uAC1C\uC6D4\uAC04 {installCount}\uAC74 \uC774\uC0C1 \uC124\uCE58 \uC9C4\uD589\uD588\uC2B5\uB2C8\uB2E4. \uC9C0\uC5ED \uC0C1\uAD8C \uD2B9\uC131\uC744 \uC798 \uC544\uB294 \uB9E4\uB2C8\uC800\uAC00 \uB2F4\uB2F9\uD569\uB2C8\uB2E4."
  },
  {
    q: "{location} \uB9E4\uC7A5\uC5D0 \uD0A4\uC624\uC2A4\uD06C\uB9CC \uC124\uCE58 \uAC00\uB2A5\uD55C\uAC00\uC694?",
    a: "\uD544\uC694\uD55C \uC7A5\uBE44\uB9CC \uC120\uD0DD\uD574 \uC124\uCE58 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uCE74\uB4DC\uB2E8\uB9D0\uAE30\xB7\uD3EC\uC2A4\uAE30\xB7\uD0A4\uC624\uC2A4\uD06C \uC911 1\uAC1C\uB9CC \uC124\uCE58\uD574\uB3C4 \uBB34\uBC29\uD569\uB2C8\uB2E4."
  },
  {
    q: "{location}\uC5D0\uC11C \uCE74\uB4DC\uB2E8\uB9D0\uAE30\uB9CC \uBE4C\uB9AC\uB294 \uAC83\uB3C4 \uB418\uB098\uC694?",
    a: "\uB124, \uB80C\uD0C8\uACFC \uAD6C\uB9E4 \uBAA8\uB450 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uCD08\uAE30 \uBE44\uC6A9 \uBD80\uB2F4\uC744 \uC904\uC774\uB824\uBA74 \uB80C\uD0C8\uC744 \uCD94\uCC9C\uB4DC\uB9BD\uB2C8\uB2E4."
  },
  {
    q: "{location} \uBC30\uB2EC \uC571\uACFC \uC5F0\uB3D9 \uC124\uC815\uB3C4 \uD574\uC8FC\uB098\uC694?",
    a: "\uBC30\uBBFC\xB7\uCFE0\uD321\uC774\uCE20\xB7\uC694\uAE30\uC694 \uB4F1 \uC8FC\uC694 \uBC30\uB2EC \uC571 \uC5F0\uB3D9\uAE4C\uC9C0 \uC124\uCE58\uC640 \uD568\uAED8 \uC644\uB8CC\uD574\uB4DC\uB9BD\uB2C8\uB2E4."
  },
  {
    q: "{location}\uC5D0 \uC601\uC5C5 \uC911\uC778 \uB9E4\uC7A5\uB3C4 \uAD50\uCCB4 \uAC00\uB2A5\uD55C\uAC00\uC694?",
    a: "\uC601\uC5C5\uC5D0 \uC9C0\uC7A5 \uC5C6\uB3C4\uB85D \uC2EC\uC57C\xB7\uC0C8\uBCBD \uC2DC\uAC04 \uC124\uCE58\uB3C4 \uAC00\uB2A5\uD569\uB2C8\uB2E4. {location} \uC9C0\uC5ED\uC740 \uC720\uC5F0\uD55C \uC77C\uC815 \uC870\uC728\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    q: "{location} \uD504\uB79C\uCC28\uC774\uC988 \uBCF8\uC0AC \uC7A5\uBE44\uB3C4 \uD638\uD658\uB418\uB098\uC694?",
    a: "\uC8FC\uC694 \uD504\uB79C\uCC28\uC774\uC988 \uBCF8\uC0AC \uC2DC\uC2A4\uD15C\uACFC \uC5F0\uB3D9 \uC791\uC5C5 \uACBD\uD5D8\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uBCF8\uC0AC \uC2B9\uC778 \uD6C4 \uC124\uCE58 \uC9C4\uD589\uD569\uB2C8\uB2E4."
  }
];
var installRecordTemplates = [
  { days: 3, industry: "\uCE74\uD398", product: "\uD0A4\uC624\uC2A4\uD06C", outcome: "\uC8FC\uBB38 \uB300\uAE30 \uC2DC\uAC04 40% \uB2E8\uCD95" },
  { days: 5, industry: "\uC2DD\uB2F9", product: "\uD3EC\uC2A4\uAE30", outcome: "\uBC30\uB2EC \uD1B5\uD569 \uAD00\uB9AC \uC2DC\uC2A4\uD15C \uAD6C\uCD95" },
  { days: 7, industry: "\uBBF8\uC6A9\uC2E4", product: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", outcome: "\uC608\uC57D\xB7\uACB0\uC81C \uD1B5\uD569 \uC644\uB8CC" },
  { days: 8, industry: "\uBD84\uC2DD\uC9D1", product: "\uD0A4\uC624\uC2A4\uD06C", outcome: "\uD640 \uC778\uAC74\uBE44 40% \uC808\uAC10" },
  { days: 10, industry: "\uBCA0\uC774\uCEE4\uB9AC", product: "\uD3EC\uC2A4\uAE30", outcome: "\uC7AC\uACE0 \uAD00\uB9AC \uC790\uB3D9\uD654" },
  { days: 12, industry: "\uCE58\uD0A8\uC9D1", product: "\uD3EC\uC2A4\uAE30", outcome: "\uBC30\uB2EC \uC571 3\uC0AC \uD1B5\uD569" },
  { days: 14, industry: "\uCE74\uD398", product: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", outcome: "VAN \uC218\uC218\uB8CC \uC5F0 48\uB9CC\uC6D0 \uC808\uC57D" },
  { days: 15, industry: "\uD559\uC6D0", product: "\uD3EC\uC2A4\uAE30", outcome: "\uC218\uAC15\uB8CC \uC790\uB3D9 \uAD00\uB9AC" },
  { days: 17, industry: "\uD53C\uD2B8\uB2C8\uC2A4", product: "\uD0A4\uC624\uC2A4\uD06C", outcome: "\uD68C\uC6D0\uAD8C \uBB34\uC778 \uD310\uB9E4" },
  { days: 20, industry: "\uC2DD\uB2F9", product: "\uD0A4\uC624\uC2A4\uD06C", outcome: "\uD53C\uD06C \uD0C0\uC784 \uD68C\uC804\uC728 30% \uAC1C\uC120" },
  { days: 22, industry: "\uBD84\uC2DD\uC9D1", product: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", outcome: "\uBB34\uC120 \uB2E8\uB9D0\uAE30\uB85C \uD14C\uC774\uBE14 \uACB0\uC81C" },
  { days: 25, industry: "\uCE74\uD398", product: "\uD3EC\uC2A4\uAE30", outcome: "\uB9E4\uCD9C \uB9AC\uD3EC\uD2B8 \uC790\uB3D9\uD654" }
];
var seasonalTips = [
  "\uAC1C\uC5C5 \uC9C1\uC804 \uCD5C\uB300 2\uC8FC \uC804\uC5D0 \uC124\uCE58 \uC0C1\uB2F4\uC744 \uC2DC\uC791\uD558\uBA74 \uC138\uD305\uACFC \uD14C\uC2A4\uD2B8\uAE4C\uC9C0 \uCDA9\uBD84\uD788 \uC5EC\uC720\uB97C \uAC00\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  "\uC2E0\uADDC \uC624\uD508 \uB9E4\uC7A5\uC740 \uCE74\uB4DC\uB2E8\uB9D0\uAE30\xB7POS\uB97C \uBA3C\uC800 \uC124\uCE58\uD558\uACE0, \uD0A4\uC624\uC2A4\uD06C\uB294 \uC6B4\uC601 1~2\uC8FC \uD6C4 \uCD94\uAC00\uD558\uB294 \uAC83\uC744 \uCD94\uCC9C\uD569\uB2C8\uB2E4.",
  "\uD504\uB79C\uCC28\uC774\uC988 \uAC00\uB9F9\uC810\uC774\uB77C\uBA74 \uBCF8\uC0AC \uC9C0\uC815 \uC7A5\uBE44 \uC5EC\uBD80\uB97C \uBA3C\uC800 \uD655\uC778\uD558\uC138\uC694. \uB3C5\uB9BD \uC6B4\uC601 \uB9E4\uC7A5\uC740 VAN\uC0AC \uBE44\uAD50\uB85C \uC218\uC218\uB8CC \uC808\uC57D\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4.",
  "\uD53C\uD06C \uD0C0\uC784 \uD68C\uC804\uC728\uC774 \uC911\uC694\uD55C \uB9E4\uC7A5\uC774\uB77C\uBA74 \uC790\uB3D9\uCEE4\uD305 \uB2E8\uB9D0\uAE30\uC640 \uD0A4\uC624\uC2A4\uD06C \uC870\uD569\uC774 \uD6A8\uACFC\uC801\uC785\uB2C8\uB2E4.",
  "\uBC30\uB2EC \uB9E4\uC7A5\uC740 POS\uC5D0 \uBC30\uBBFC\xB7\uCFE0\uD321\uC774\uCE20\xB7\uC694\uAE30\uC694 \uD1B5\uD569 \uC124\uC815\uC744 \uAF2D \uD3EC\uD568\uD558\uC138\uC694. \uC8FC\uBB38 \uB204\uB77D \uC704\uD5D8\uC774 \uD06C\uAC8C \uC904\uC5B4\uB4ED\uB2C8\uB2E4.",
  "24\uC2DC\uAC04 \uC6B4\uC601 \uB9E4\uC7A5\uC740 \uBB34\uC778\uACB0\uC81C\xB7CCTV\xB7\uC6D0\uACA9 \uBAA8\uB2C8\uD130\uB9C1\uC744 \uBB36\uC5B4\uC11C \uC124\uCE58\uD558\uBA74 \uD6A8\uC728\uC774 \uADF9\uB300\uD654\uB429\uB2C8\uB2E4.",
  "1\uC778 \uC6B4\uC601 \uB9E4\uC7A5\uC740 \uD3EC\uC2A4 \uC5C6\uC774 \uD0A4\uC624\uC2A4\uD06C + \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \uC870\uD569\uC73C\uB85C\uB3C4 \uCDA9\uBD84\uD788 \uC6B4\uC601 \uAC00\uB2A5\uD569\uB2C8\uB2E4.",
  "\uC784\uB300 \uB9CC\uB8CC \uC2DC\uAE30\uAC00 \uAC00\uAE4C\uC6B4 \uB9E4\uC7A5\uC740 \uB80C\uD0C8 \uBC29\uC2DD\uC744 \uC120\uD0DD\uD574 \uCD08\uAE30 \uBE44\uC6A9 \uBD80\uB2F4\uC744 \uC904\uC774\uB294 \uAC83\uC774 \uD569\uB9AC\uC801\uC785\uB2C8\uB2E4."
];

// src/components/sections/Variants.tsx
var FAQ = ({ seed, locationLabel }) => {
  const items = pickMany(faqPool, 4, seed);
  const installCount = seededInt(seed, 0, 8, 35);
  return /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--white); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "FAQ" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      locationLabel,
      " ",
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC774 \uC9C0\uC5ED \uC0AC\uC7A5\uB2D8\uB4E4\uC774 \uB9CE\uC774 \uAD81\uAE08\uD574\uD558\uC168\uB358 \uB0B4\uC6A9\uB4E4\uC744 \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4." }),
    /* @__PURE__ */ jsxDEV("div", { style: "display: flex; flex-direction: column; gap: 2px; margin-top: 40px;", children: items.map((item) => /* @__PURE__ */ jsxDEV(
      "div",
      {
        style: "background: var(--white); border: 0.5px solid var(--line); padding: 24px 28px; border-radius: 16px;",
        children: [
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              style: "display: flex; gap: 16px; align-items: flex-start; margin-bottom: 10px;",
              children: [
                /* @__PURE__ */ jsxDEV(
                  "span",
                  {
                    style: "font-family: 'Bricolage Grotesque', sans-serif; color: var(--orange); font-weight: 700; font-size: 14px; flex-shrink: 0;",
                    children: "Q."
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    style: "font-size: 16px; font-weight: 800; letter-spacing: -0.03em; color: var(--black);",
                    children: fillTemplate(item.q, { location: locationLabel })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxDEV("div", { style: "display: flex; gap: 16px; align-items: flex-start;", children: [
            /* @__PURE__ */ jsxDEV(
              "span",
              {
                style: "font-family: 'Bricolage Grotesque', sans-serif; color: var(--muted); font-weight: 700; font-size: 14px; flex-shrink: 0;",
                children: "A."
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-size: 14px; color: var(--muted); line-height: 1.7; font-weight: 300;",
                children: fillTemplate(item.a, {
                  location: locationLabel,
                  installCount
                })
              }
            )
          ] })
        ]
      }
    )) })
  ] }) });
};
var LocalInsight = ({ locationLabel, meta: meta2, seed }) => {
  const densityLabel = meta2.density === "high" ? "\uACE0\uBC00\uB3C4 \uC0C1\uAD8C" : meta2.density === "medium" ? "\uC911\uBC00\uB3C4 \uC0C1\uAD8C" : "\uC800\uBC00\uB3C4 \uC0C1\uAD8C";
  const densityColor = meta2.density === "high" ? "var(--orange)" : meta2.density === "medium" ? "var(--brown)" : "var(--muted)";
  return /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--ivory);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "LOCAL INSIGHT" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      locationLabel,
      "\uC5D0 \uB300\uD574",
      /* @__PURE__ */ jsxDEV("br", {}),
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC54C\uACE0 \uC788\uB294 \uAC83\uB4E4." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC9C0\uC5ED \uC0C1\uAD8C \uD2B9\uC131\uC744 \uBC14\uD0D5\uC73C\uB85C \uCD5C\uC801 \uAD6C\uC131\uC744 \uC81C\uC548\uD569\uB2C8\uB2E4." }),
    /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 14px; margin-top: 40px;", children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: "background: var(--brown); color: var(--white); padding: 36px 32px; border-radius: 16px; position: relative; overflow: hidden;",
          children: [
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--orange);"
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.2em; color: var(--orange); font-weight: 700; margin-bottom: 20px;",
                children: "AREA BRIEF"
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-size: 20px; font-weight: 800; line-height: 1.45; letter-spacing: -0.03em;",
                children: meta2.insight
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: "background: var(--white); border: 0.5px solid var(--line); padding: 32px 28px; border-radius: 16px;",
          children: [
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.2em; color: var(--orange); font-weight: 700; margin-bottom: 20px;",
                children: "TOP INDUSTRIES"
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-size: 13px; color: var(--muted); font-weight: 300; margin-bottom: 16px;",
                children: "\uC774 \uC9C0\uC5ED\uC758 \uC8FC\uC694 \uC5C5\uC885"
              }
            ),
            /* @__PURE__ */ jsxDEV("div", { style: "display: flex; flex-direction: column; gap: 8px;", children: meta2.topIndustries.map((ind, idx) => /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 0.5px dashed var(--line);",
                children: [
                  /* @__PURE__ */ jsxDEV(
                    "span",
                    {
                      style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--muted); font-weight: 600;",
                      children: String(idx + 1).padStart(2, "0")
                    }
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "span",
                    {
                      style: "font-size: 15px; font-weight: 700; letter-spacing: -0.03em;",
                      children: ind
                    }
                  )
                ]
              }
            )) })
          ]
        }
      ),
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: "background: var(--white); border: 0.5px solid var(--line); padding: 32px 28px; border-radius: 16px; display: flex; flex-direction: column; gap: 20px;",
          children: [
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; letter-spacing: 0.2em; color: var(--orange); font-weight: 700;",
                children: "STATS"
              }
            ),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: 700; letter-spacing: -0.03em; color: var(--black); line-height: 1;",
                  children: [
                    meta2.installCount,
                    /* @__PURE__ */ jsxDEV("span", { style: "color: var(--orange); font-size: 20px;", children: "+" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  style: "font-size: 11px; color: var(--muted); letter-spacing: 0.05em; margin-top: 6px; font-weight: 500;",
                  children: "\uCD5C\uADFC 3\uAC1C\uC6D4 \uC124\uCE58"
                }
              )
            ] }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  style: "font-size: 11px; color: var(--muted); letter-spacing: 0.08em; margin-bottom: 4px; font-weight: 500;",
                  children: "PRIMARY PRODUCT"
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { style: "font-size: 16px; font-weight: 900; letter-spacing: -0.03em;", children: meta2.primaryProduct })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "display: inline-block; padding: 4px 10px; background: var(--orange-tint); color: var(--brown); font-size: 11px; font-weight: 700; border-radius: 100px;",
                children: densityLabel
              }
            ) })
          ]
        }
      )
    ] })
  ] }) });
};
var InstallRecord = ({ seed, locationLabel }) => {
  const records = pickMany(installRecordTemplates, 5, seed);
  const tip = pickOne(seasonalTips, seed, 1);
  return /* @__PURE__ */ jsxDEV("section", { style: "padding: 100px 0; background: var(--white);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "INSTALL LOG" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      locationLabel,
      "\uC5D0\uC11C",
      /* @__PURE__ */ jsxDEV("br", {}),
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uCD5C\uADFC \uC124\uCE58\uB41C \uAE30\uB85D." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uC774 \uC9C0\uC5ED \uB9E4\uC7A5\uB4E4\uC774 \uC5B4\uB5A4 \uAD6C\uC131\uC744 \uC120\uD0DD\uD588\uB294\uC9C0 \uD655\uC778\uD574\uBCF4\uC138\uC694." }),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 40px;",
        children: records.map((r) => /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: "background: var(--white); border: 0.5px solid var(--line); padding: 22px 20px; border-radius: 16px;",
            children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;",
                  children: [
                    /* @__PURE__ */ jsxDEV(
                      "span",
                      {
                        style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--muted); letter-spacing: 0.05em; font-weight: 500;",
                        children: [
                          r.days,
                          "\uC77C \uC804"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "span",
                      {
                        style: "font-size: 10px; padding: 3px 8px; background: var(--orange-tint); color: var(--brown); border-radius: 100px; font-weight: 700;",
                        children: r.industry
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  style: "font-size: 15px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px;",
                  children: r.product
                }
              ),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  style: "font-size: 12px; color: var(--muted); line-height: 1.5; font-weight: 300;",
                  children: r.outcome
                }
              )
            ]
          }
        ))
      }
    ),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        style: "margin-top: 32px; background: var(--ivory); padding: 28px 32px; border-radius: 16px; display: flex; gap: 20px; align-items: flex-start;",
        children: [
          /* @__PURE__ */ jsxDEV("span", { style: "font-size: 22px;", children: "\u{1F4A1}" }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--orange); letter-spacing: 0.2em; font-weight: 700; margin-bottom: 8px;",
                children: "PRO TIP"
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: "font-size: 14px; color: var(--black); line-height: 1.65; font-weight: 400;",
                children: tip
              }
            )
          ] })
        ]
      }
    )
  ] }) });
};

// src/components/sections/BusinessConfig.tsx
var configs = [
  {
    num: "01",
    name: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30\uB9CC",
    desc: "\uC18C\uD615 \uCE74\uD398\xB7\uBD84\uC2DD\uC9D1\xB7\uBC30\uB2EC \uC804\uBB38\uC810. \uACB0\uC81C\uB9CC \uD544\uC694\uD55C \uB9E4\uC7A5\uC758 \uCD5C\uC18C \uAD6C\uC131.",
    popular: false
  },
  {
    num: "02",
    name: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 + \uD3EC\uC2A4\uAE30",
    desc: "\uC77C\uBC18 \uC2DD\uB2F9\xB7\uCE74\uD398\uC758 \uD45C\uC900 \uC870\uD569. \uC8FC\uBB38\xB7\uACB0\uC81C\xB7\uB9E4\uCD9C \uBD84\uC11D\uC744 \uD55C \uBC88\uC5D0.",
    popular: true
  },
  {
    num: "03",
    name: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 + \uD3EC\uC2A4\uAE30 + \uD0A4\uC624\uC2A4\uD06C",
    desc: "\uBD84\uC2DD\xB7\uD328\uC2A4\uD2B8\uD478\uB4DC \uB4F1 \uD68C\uC804\uC728 \uC911\uC694\uD55C \uB9E4\uC7A5. \uC778\uAC74\uBE44\uB294 \uC904\uC774\uACE0 \uC8FC\uBB38 \uC18D\uB3C4\uB294 \uC62C\uB9AC\uB294 \uBB34\uC778 \uC804\uD658\uD615.",
    popular: false
  },
  {
    num: "04",
    name: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30 + \uD3EC\uC2A4\uAE30 + \uD14C\uC774\uBE14\uC624\uB354",
    desc: "\uACE0\uAE09 \uB808\uC2A4\uD1A0\uB791\xB7\uD55C\uC2DD\uB2F9. \uC11C\uBE59 \uD488\uC9C8\uC740 \uC720\uC9C0\uD558\uBA74\uC11C \uC778\uB825 \uBD80\uB2F4\uC740 \uC904\uC785\uB2C8\uB2E4.",
    popular: false
  },
  {
    num: "05",
    name: "\uC2E0\uADDC \uC624\uD508 \uC62C\uC778\uC6D0 \uD328\uD0A4\uC9C0",
    desc: "\uC2E0\uADDC \uCC3D\uC5C5 \uB9E4\uC7A5. \uACB0\uC81C\xB7\uC6B4\uC601\xB7\uBCF4\uC548\xB7\uD1B5\uC2E0\uC744 \uD55C \uBC88\uC5D0 \uC644\uC131\uD558\uB294 \uD328\uD0A4\uC9C0.",
    popular: true
  },
  {
    num: "06",
    name: "\uD0A4\uC624\uC2A4\uD06C + \uCE74\uB4DC\uB2E8\uB9D0\uAE30",
    desc: "\uBB34\uC778 \uB9E4\uC7A5\xB7\uC18C\uD615 \uCE74\uD398. \uD63C\uC790\uC11C\uB3C4 \uC6B4\uC601 \uAC00\uB2A5\uD55C \uBB34\uC778 \uC804\uD658\uD615 \uAD6C\uC131.",
    popular: false
  }
];
var BusinessConfig = ({ locationLabel }) => {
  return /* @__PURE__ */ jsxDEV("section", { class: "business-configs", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "BUSINESS-FIT SOLUTION" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      locationLabel,
      " \uB9E4\uC7A5\uC5D0 \uB531 \uB9DE\uB294",
      /* @__PURE__ */ jsxDEV("br", {}),
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uB9DE\uCDA4 \uAD6C\uC131 6\uAC00\uC9C0." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uAC00\uC7A5 \uB9CE\uC774 \uC124\uCE58\uD55C 6\uAC00\uC9C0 \uAD6C\uC131 \uC911 \uBE44\uC2B7\uD55C \uC5C5\uC885\uC744 \uCC3E\uC544\uBCF4\uC138\uC694." }),
    /* @__PURE__ */ jsxDEV("div", { class: "config-list", children: configs.map((c) => /* @__PURE__ */ jsxDEV("a", { class: "config-row", href: "#contact", children: [
      c.popular && /* @__PURE__ */ jsxDEV("span", { class: "popular-badge", children: "\u2605 POPULAR" }),
      /* @__PURE__ */ jsxDEV("div", { class: "config-head", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "config-num", children: c.num }),
        /* @__PURE__ */ jsxDEV("span", { class: "config-name", children: c.name })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "config-desc", children: c.desc })
    ] })) })
  ] }) });
};
var InstallSteps = () => {
  const steps = [
    {
      num: "01",
      label: "STEP ONE",
      name: "\uBB34\uB8CC \uC0C1\uB2F4",
      desc: "\uC5C5\uC885\xB7\uB9E4\uC7A5 \uADDC\uBAA8\xB7\uD544\uC694 \uC7A5\uBE44\uB97C \uB4E3\uACE0 \uCD5C\uC801 \uAD6C\uC131\uC744 \uC81C\uC548\uD569\uB2C8\uB2E4.",
      time: "10\uBD84 \uC774\uB0B4"
    },
    {
      num: "02",
      label: "STEP TWO",
      name: "\uACAC\uC801 \uD655\uC815",
      desc: "VAN\uC0AC\xB7\uC7A5\uBE44\xB7\uC218\uC218\uB8CC\uB97C \uBE44\uAD50\uD55C \uD22C\uBA85\uD55C \uACAC\uC801\uC744 \uB4DC\uB9BD\uB2C8\uB2E4.",
      time: "\uC0C1\uB2F4 \uD6C4 \uBC1C\uC1A1"
    },
    {
      num: "03",
      label: "STEP THREE",
      name: "\uD604\uC7A5 \uC124\uCE58",
      desc: "\uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uB9E4\uC7A5\uC744 \uC9C1\uC811 \uBC29\uBB38\uD574 \uC138\uD305\uAE4C\uC9C0 \uC644\uB8CC\uD569\uB2C8\uB2E4.",
      time: "\uC77C\uC815 \uD611\uC758"
    },
    {
      num: "04",
      label: "STEP FOUR",
      name: "A/S \uC9C0\uC6D0",
      desc: "\uC6D0\uACA9 \uC9C0\uC6D0\uACFC \uD604\uC7A5 \uBC29\uBB38\uC73C\uB85C \uC2E0\uC18D \uB300\uC751\uD569\uB2C8\uB2E4.",
      time: "365\uC77C"
    }
  ];
  return /* @__PURE__ */ jsxDEV("section", { class: "install-process", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "INSTALLATION STEPS" }),
    /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
      "\uC0C1\uB2F4\uBD80\uD130 \uC124\uCE58\uAE4C\uC9C0 ",
      /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uB2E8 4\uB2E8\uACC4." })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "sec-sub", children: "\uBCF5\uC7A1\uD55C \uC808\uCC28 \uC5C6\uC774, \uC804\uD654 \uD55C \uD1B5\uC774\uBA74 \uC2DC\uC791\uB429\uB2C8\uB2E4." }),
    /* @__PURE__ */ jsxDEV("div", { class: "install-steps", children: steps.map((s) => /* @__PURE__ */ jsxDEV("div", { class: "install-step", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "step-head", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "step-badge", children: s.num }),
        /* @__PURE__ */ jsxDEV("div", { class: "step-label", children: s.label })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-name", children: s.name }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-desc", children: s.desc }),
      /* @__PURE__ */ jsxDEV("div", { class: "step-time", children: s.time })
    ] })) })
  ] }) });
};

// src/data/districtMeta.ts
var districtMeta = {
  seoul: {
    "\uAC15\uB0A8\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBBF8\uC6A9\uC2E4"],
      installCount: 47,
      primaryProduct: "\uD0A4\uC624\uC2A4\uD06C",
      insight: "\uD504\uB79C\uCC28\uC774\uC988 \uCE74\uD398 \uBC00\uB3C4 \uC11C\uC6B8 \uCD5C\uACE0. \uD53C\uD06C \uD0C0\uC784 \uD68C\uC804\uC728 \uC704\uD55C \uD0A4\uC624\uC2A4\uD06C \uC218\uC694\uAC00 \uD2B9\uD788 \uB192\uC2B5\uB2C8\uB2E4.",
      density: "high"
    },
    "\uAC15\uB3D9\uAD6C": {
      topIndustries: ["\uBD84\uC2DD\uC9D1", "\uD559\uC6D0", "\uCE74\uD398"],
      installCount: 18,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC8FC\uAC70 \uC0C1\uAD8C \uC911\uC2EC. \uB3D9\uB124 \uBC00\uCC29\uD615 \uB9E4\uC7A5\uC774 \uB9CE\uC544 \uB2E8\uC21C\uD55C POS \uAD6C\uC131\uC774 \uC120\uD638\uB429\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uAC15\uBD81\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uBBF8\uC6A9\uC2E4"],
      installCount: 12,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "1\uC778 \uC790\uC601\uC5C5\uC790 \uBE44\uC911 \uB192\uC74C. \uCD08\uAE30 \uBE44\uC6A9 \uBD80\uB2F4 \uC801\uC740 \uB80C\uD0C8\uD615 \uCE74\uB4DC\uB2E8\uB9D0\uAE30\uAC00 \uC778\uAE30.",
      density: "medium"
    },
    "\uAC15\uC11C\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD53C\uD2B8\uB2C8\uC2A4"],
      installCount: 22,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uB9C8\uACE1 \uC5C5\uBB34\uC9C0\uAD6C \uD65C\uC131\uD654\uB85C \uC810\uC2EC \uD68C\uC804\uC728 \uC911\uC2DC. \uBE60\uB978 \uACB0\uC81C \uB2E8\uB9D0\uAE30 \uC218\uC694 \uC99D\uAC00 \uC911.",
      density: "medium"
    },
    "\uAD00\uC545\uAD6C": {
      topIndustries: ["\uBD84\uC2DD\uC9D1", "\uD559\uC6D0", "\uCE74\uD398"],
      installCount: 16,
      primaryProduct: "\uD0A4\uC624\uC2A4\uD06C",
      insight: "\uC11C\uC6B8\uB300 \uC0C1\uAD8C \uC601\uD5A5\uC73C\uB85C \uD559\uC0DD \uACE0\uAC1D \uB9CE\uC74C. \uBB34\uC778 \uC8FC\uBB38 \uD0A4\uC624\uC2A4\uD06C \uC218\uC694 \uC0C1\uC704.",
      density: "medium"
    },
    "\uAD11\uC9C4\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD559\uC6D0"],
      installCount: 15,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uAC74\uB300 \uC0C1\uAD8C \uC911\uC2EC. \uAC1D\uB2E8\uAC00 \uB0AE\uACE0 \uD68C\uC804 \uBE60\uB978 \uB9E4\uC7A5\uC774 \uB9CE\uC544 POS \uC131\uB2A5\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uAD6C\uB85C\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uBBF8\uC6A9\uC2E4"],
      installCount: 14,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uB514\uC9C0\uD138\uB2E8\uC9C0 \uC9C1\uC7A5\uC778 \uC0C1\uAD8C + \uC8FC\uAC70 \uC0C1\uAD8C\uC774 \uD63C\uC7AC. \uBB34\uC120 \uB2E8\uB9D0\uAE30 \uC218\uC694\uAC00 \uAFB8\uC900\uD569\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uAE08\uCC9C\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uCE74\uD398"],
      installCount: 11,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uAC00\uC0B0\uB514\uC9C0\uD138\uB2E8\uC9C0 \uBC30\uD6C4 \uC0C1\uAD8C. \uC810\uC2EC \uD53C\uD06C \uB300\uC751\uD615 POS \uC138\uD305\uC774 \uC8FC\uB958.",
      density: "medium"
    },
    "\uB178\uC6D0\uAD6C": {
      topIndustries: ["\uD559\uC6D0", "\uBD84\uC2DD\uC9D1", "\uCE74\uD398"],
      installCount: 19,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uD559\uC6D0\uAC00 \uBC00\uC9D1\uB3C4 \uC11C\uC6B8 \uCD5C\uC0C1\uC704\uAD8C. \uD559\uC6D0 \uC218\uAC15\uB8CC POS \uAD6C\uCD95 \uC218\uC694\uAC00 \uB450\uB4DC\uB7EC\uC9D1\uB2C8\uB2E4.",
      density: "high"
    },
    "\uB3C4\uBD09\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBBF8\uC6A9\uC2E4", "\uBD84\uC2DD\uC9D1"],
      installCount: 9,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uB3D9\uB124 \uC0C1\uAD8C \uC704\uC8FC. \uAE30\uBCF8 \uB2E8\uB9D0\uAE30 + \uAC04\uB2E8\uD55C POS \uC870\uD569\uC774 \uB300\uBD80\uBD84\uC785\uB2C8\uB2E4.",
      density: "low"
    },
    "\uB3D9\uB300\uBB38\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 17,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uCCAD\uB7C9\uB9AC\xB7\uC804\uB18D\uB3D9 \uC7AC\uAC1C\uBC1C\uACFC \uD568\uAED8 \uC2E0\uADDC \uC624\uD508 \uB9E4\uC7A5 \uC99D\uAC00. \uD1B5\uD569 POS \uC218\uC694 \uC0C1\uC2B9\uC138.",
      density: "medium"
    },
    "\uB3D9\uC791\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD559\uC6D0"],
      installCount: 14,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uB178\uB7C9\uC9C4 \uD559\uC6D0\uAC00 + \uC0C1\uB3C4\uB3D9 \uC8FC\uAC70\uC0C1\uAD8C. \uC5C5\uC885\uBCC4 \uCEE4\uC2A4\uD140 \uC138\uD305 \uC218\uC694\uAC00 \uB2E4\uC591\uD569\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uB9C8\uD3EC\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 35,
      primaryProduct: "\uD0A4\uC624\uC2A4\uD06C",
      insight: "\uD64D\uB300\xB7\uC5F0\uB0A8\xB7\uB9DD\uC6D0 \uC0C1\uAD8C\uC73C\uB85C \uC11C\uC6B8 \uD575\uC2EC F&B \uC9C0\uC5ED. \uBE0C\uB79C\uB4DC \uB9E4\uC7A5 \uD0A4\uC624\uC2A4\uD06C \uBE44\uC728 \uC555\uB3C4\uC801.",
      density: "high"
    },
    "\uC11C\uB300\uBB38\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uD559\uC6D0", "\uC74C\uC2DD\uC810"],
      installCount: 13,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uB300\uD559 \uC0C1\uAD8C\uACFC \uC8FC\uAC70 \uC0C1\uAD8C \uD63C\uC7AC. \uC18C\uADDC\uBAA8 \uAC1C\uC778 \uCE74\uD398 POS \uAD6C\uCD95\uC774 \uB9CE\uC2B5\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uC11C\uCD08\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uD53C\uD2B8\uB2C8\uC2A4"],
      installCount: 28,
      primaryProduct: "\uD0A4\uC624\uC2A4\uD06C",
      insight: "\uBC95\uC870\uD0C0\uC6B4\xB7\uAC15\uB0A8 \uC811\uADFC\uC131\uC73C\uB85C \uACE0\uC18C\uB4DD \uC0C1\uAD8C. \uD504\uB9AC\uBBF8\uC5C4 \uC7A5\uBE44 \uC138\uD305 \uBE44\uC911 \uB192\uC2B5\uB2C8\uB2E4.",
      density: "high"
    },
    "\uC131\uB3D9\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 24,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC131\uC218\uB3D9 \uD799\uD50C\uB808\uC774\uC2A4 \uD6A8\uACFC. \uBE0C\uB79C\uB4DC \uC544\uC774\uB374\uD2F0\uD2F0 \uAC15\uD55C \uB9E4\uC7A5\uB4E4\uC758 \uB9DE\uCDA4 POS \uC138\uD305\uC774 \uD2B9\uC9D5.",
      density: "high"
    },
    "\uC131\uBD81\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uD559\uC6D0", "\uBD84\uC2DD\uC9D1"],
      installCount: 11,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC8FC\uAC70 \uBC00\uC9D1\uB3C4 \uB192\uACE0 \uC624\uB798\uB41C \uB3D9\uB124 \uC0C1\uAD8C. \uAD50\uCCB4\uBCF4\uB2E4\uB294 \uC2E0\uADDC \uC124\uCE58\uAC00 \uC8FC\uB958\uC785\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uC1A1\uD30C\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uD559\uC6D0"],
      installCount: 32,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC7A0\uC2E4\xB7\uBB38\uC815 \uC2E0\uD765 \uC0C1\uAD8C. \uB300\uD615 \uB9E4\uC7A5\uACFC \uD504\uB79C\uCC28\uC774\uC988 \uBE44\uC911\uC774 \uB192\uC544 \uD1B5\uD569 POS\uAC00 \uAE30\uBCF8.",
      density: "high"
    },
    "\uC591\uCC9C\uAD6C": {
      topIndustries: ["\uD559\uC6D0", "\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1"],
      installCount: 21,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uBAA9\uB3D9 \uD559\uC6D0\uAC00 \uC911\uC2EC. \uC218\uAC15\uB8CC \uAD00\uB9AC\uC640 \uCD9C\uACB0 \uC2DC\uC2A4\uD15C \uACB0\uD569 POS \uC218\uC694\uAC00 \uD2B9\uD788 \uB9CE\uC2B5\uB2C8\uB2E4.",
      density: "high"
    },
    "\uC601\uB4F1\uD3EC\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 26,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC5EC\uC758\uB3C4 \uC9C1\uC7A5\uC778 + \uC601\uB4F1\uD3EC \uC804\uD1B5 \uC0C1\uAD8C \uD63C\uC7AC. \uC810\uC2EC\xB7\uD1F4\uADFC \uD53C\uD06C \uB300\uC751 \uB2E8\uB9D0\uAE30 \uC911\uC694.",
      density: "high"
    },
    "\uC6A9\uC0B0\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 23,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC774\uD0DC\uC6D0\xB7\uD55C\uB0A8\uB3D9 \uC678\uAD6D\uC778 \uACE0\uAC1D \uC0C1\uAD8C. \uB2E4\uAD6D\uC5B4 \uBA54\uB274 \uC9C0\uC6D0 POS \uC218\uC694\uAC00 \uB3C5\uD2B9\uD569\uB2C8\uB2E4.",
      density: "high"
    },
    "\uC740\uD3C9\uAD6C": {
      topIndustries: ["\uBD84\uC2DD\uC9D1", "\uC74C\uC2DD\uC810", "\uBBF8\uC6A9\uC2E4"],
      installCount: 10,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC8FC\uAC70 \uC911\uC2EC\uC758 \uC870\uC6A9\uD55C \uC0C1\uAD8C. 1\uC778 \uC6B4\uC601 \uC18C\uD615 \uB9E4\uC7A5\uC758 \uAE30\uBCF8 \uC7A5\uBE44 \uAD6C\uC131\uC774 \uB300\uBD80\uBD84.",
      density: "low"
    },
    "\uC885\uB85C\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 20,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC804\uD1B5\uACFC \uAD00\uAD11 \uC0C1\uAD8C\uC774 \uACF5\uC874. \uC624\uB798\uB41C \uB9E4\uC7A5 \uAD50\uCCB4 \uC218\uC694\uC640 \uAD00\uAD11\uC9C0 \uC2E0\uADDC \uC624\uD508\uC774 \uBCD1\uD589\uB429\uB2C8\uB2E4.",
      density: "high"
    },
    "\uC911\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 22,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uBA85\uB3D9\xB7\uC744\uC9C0\uB85C \uAD00\uAD11 + \uC9C1\uC7A5\uC778 \uBCF5\uD569 \uC0C1\uAD8C. \uB2E4\uC591\uD55C \uACB0\uC81C\uC218\uB2E8 \uC9C0\uC6D0\uC774 \uD544\uC218\uC785\uB2C8\uB2E4.",
      density: "high"
    },
    "\uC911\uB791\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uBBF8\uC6A9\uC2E4"],
      installCount: 8,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uB3D9\uB124\uD615 \uC0C1\uAD8C \uC911\uC2EC. \uBE44\uC6A9 \uD6A8\uC728\uC801\uC778 \uAE30\uBCF8 \uAD6C\uC131\uC774 \uC120\uD638\uB429\uB2C8\uB2E4.",
      density: "low"
    }
  },
  gyeonggi: {
    "\uC218\uC6D0\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uD559\uC6D0"],
      installCount: 38,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC601\uD1B5\xB7\uAD11\uAD50 \uC2E0\uB3C4\uC2DC\uC640 \uAD6C\uB3C4\uC2EC \uACF5\uC874. \uC601\uD1B5\uCABD\uC740 \uBE0C\uB79C\uB4DC \uB9E4\uC7A5, \uAD6C\uB3C4\uC2EC\uC740 \uAC1C\uC778 \uB9E4\uC7A5 \uC911\uC2EC.",
      density: "high"
    },
    "\uC131\uB0A8\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD53C\uD2B8\uB2C8\uC2A4"],
      installCount: 41,
      primaryProduct: "\uD0A4\uC624\uC2A4\uD06C",
      insight: "\uD310\uAD50 \uD14C\uD06C \uC0C1\uAD8C \uACE0\uC18C\uB4DD \uC9C1\uC7A5\uC778 \uB300\uC0C1 \uB9E4\uC7A5 \uBC00\uC9D1. \uCCA8\uB2E8 \uBB34\uC778 \uC7A5\uBE44 \uC218\uC694 \uC0C1\uC704\uAD8C.",
      density: "high"
    },
    "\uC6A9\uC778\uC2DC": {
      topIndustries: ["\uD559\uC6D0", "\uCE74\uD398", "\uC74C\uC2DD\uC810"],
      installCount: 27,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC218\uC9C0\xB7\uAE30\uD765 \uC2E0\uB3C4\uC2DC \uC911\uC2EC. \uD559\uC6D0 \uBC00\uC9D1\uB3C4 \uACBD\uAE30\uB3C4 \uCD5C\uACE0 \uC218\uC900\uC785\uB2C8\uB2E4.",
      density: "high"
    },
    "\uACE0\uC591\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD559\uC6D0"],
      installCount: 29,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC77C\uC0B0 \uC2E0\uB3C4\uC2DC \uC0C1\uAD8C \uC131\uC219. \uBE0C\uB79C\uB4DC \uB9E4\uC7A5 \uBE44\uC911\uC774 \uB192\uACE0 \uD1B5\uD569 POS\uAC00 \uD45C\uC900\uC785\uB2C8\uB2E4.",
      density: "high"
    },
    "\uD654\uC131\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uD559\uC6D0"],
      installCount: 25,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uB3D9\uD0C4 \uC2E0\uB3C4\uC2DC \uAE09\uC131\uC7A5. \uC2E0\uADDC \uC624\uD508 \uB9E4\uC7A5 \uBE44\uC911\uC774 \uACBD\uAE30\uB3C4 \uB0B4 \uAC00\uC7A5 \uB192\uC2B5\uB2C8\uB2E4.",
      density: "high"
    },
    "\uBD80\uCC9C\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uCE74\uD398"],
      installCount: 22,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC11C\uC6B8 \uC811\uADFC\uC131 \uC88B\uC740 \uC8FC\uAC70 \uC0C1\uAD8C. \uC791\uC740 \uB3D9\uB124 \uB9E4\uC7A5\uBD80\uD130 \uB300\uD615 \uD504\uB79C\uCC28\uC774\uC988\uAE4C\uC9C0 \uB2E4\uC591.",
      density: "medium"
    },
    "\uB0A8\uC591\uC8FC\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 14,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uB2E4\uC0B0\xB7\uBCC4\uB0B4 \uC2E0\uB3C4\uC2DC\uB85C \uC80A\uC740 \uCE35 \uC720\uC785. \uD2B8\uB80C\uB514\uD55C \uCE74\uD398\xB7\uBCA0\uC774\uCEE4\uB9AC \uC2E0\uADDC \uC624\uD508 \uC99D\uAC00.",
      density: "medium"
    },
    "\uC548\uC0B0\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBBF8\uC6A9\uC2E4", "\uBD84\uC2DD\uC9D1"],
      installCount: 13,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uB2E4\uBB38\uD654 \uC0C1\uAD8C \uD2B9\uC131. \uB2E4\uAD6D\uC5B4 \uBA54\uB274 \uBC0F \uB2E4\uC591\uD55C \uACB0\uC81C\uC218\uB2E8 \uC9C0\uC6D0 \uC218\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uD3C9\uD0DD\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 11,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uBBF8\uAD70\uAE30\uC9C0 \uBC30\uD6C4 \uC0C1\uAD8C\uACFC \uC2E0\uB3C4\uC2DC \uC0C1\uAD8C \uD63C\uC7AC. \uC0C1\uAD8C\uBCC4 \uACE0\uAC1D\uCE35 \uCC28\uC774\uAC00 \uD07D\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uC548\uC591\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uD559\uC6D0", "\uC74C\uC2DD\uC810"],
      installCount: 17,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uD3C9\uCD0C \uD559\uC6D0\uAC00 \uC601\uD5A5\uC73C\uB85C \uD559\uC6D0 POS \uC218\uC694 \uAFB8\uC900. \uCE74\uD398\xB7\uC74C\uC2DD\uC810\uC740 \uD504\uB79C\uCC28\uC774\uC988 \uBE44\uC911 \uB192\uC74C.",
      density: "medium"
    },
    "\uC2DC\uD765\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uCE74\uD398"],
      installCount: 10,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC815\uC655\xB7\uBC30\uACE7 \uC2E0\uB3C4\uC2DC \uC131\uC7A5 \uC911. \uAE30\uBCF8 \uAD6C\uC131 \uC704\uC8FC\uC9C0\uB9CC \uC810\uCC28 POS \uC218\uC694 \uC99D\uAC00.",
      density: "medium"
    },
    "\uAE40\uD3EC\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD559\uC6D0"],
      installCount: 12,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uAE40\uD3EC\uD55C\uAC15\uC2E0\uB3C4\uC2DC \uAE09\uC131\uC7A5. \uC2E0\uADDC \uC0C1\uAC00 \uC624\uD508\uACFC \uD568\uAED8 POS \uAD6C\uCD95 \uC218\uC694 \uC99D\uAC00\uC138.",
      density: "medium"
    },
    "\uAD11\uC8FC\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 8,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC624\uD3EC\xB7\uACE4\uC9C0\uC554 \uD0DD\uC9C0\uC9C0\uAD6C \uC911\uC2EC. \uC18C\uADDC\uBAA8 \uB9E4\uC7A5\uC774 \uB2E4\uC218\uC785\uB2C8\uB2E4.",
      density: "low"
    },
    "\uAD11\uBA85\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 11,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uCCA0\uC0B0\xB7\uD558\uC548 \uC8FC\uAC70 \uC0C1\uAD8C. \uB3D9\uB124 \uBC00\uCC29\uD615 \uB9E4\uC7A5\uC774 \uC8FC\uB97C \uC774\uB8F9\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uAD70\uD3EC\uC2DC": {
      topIndustries: ["\uD559\uC6D0", "\uC74C\uC2DD\uC810", "\uCE74\uD398"],
      installCount: 9,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC0B0\uBCF8 \uC2E0\uB3C4\uC2DC \uD559\uC6D0\uAC00 \uC601\uD5A5. \uD559\uC6D0 \uAD00\uB828 POS \uC218\uC694\uAC00 \uAFB8\uC900\uD569\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uD558\uB0A8\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD53C\uD2B8\uB2C8\uC2A4"],
      installCount: 16,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uBBF8\uC0AC\uAC15\uBCC0\uB3C4\uC2DC \uC131\uC7A5\uACFC \uC2A4\uD0C0\uD544\uB4DC \uC601\uD5A5. \uD504\uB9AC\uBBF8\uC5C4 \uCE74\uD398\xB7\uC74C\uC2DD\uC810 \uC218\uC694 \uC0C1\uC2B9.",
      density: "medium"
    },
    "\uC624\uC0B0\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uBBF8\uC6A9\uC2E4"],
      installCount: 7,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC870\uC6A9\uD55C \uC911\uC18C \uB3C4\uC2DC \uC0C1\uAD8C. \uAE30\uBCF8 \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \uC911\uC2EC \uAD6C\uC131\uC774 \uD45C\uC900\uC785\uB2C8\uB2E4.",
      density: "low"
    },
    "\uC774\uCC9C\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 6,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uB18D\uCD0C\uD615 \uC0C1\uAD8C\uACFC \uBD80\uBC1C\uC74D \uC2E0\uB3C4\uC2DC\uAC00 \uACF5\uC874. \uC9C0\uC5ED\uBCC4 \uC218\uC694 \uD3B8\uCC28\uAC00 \uD07D\uB2C8\uB2E4.",
      density: "low"
    },
    "\uC591\uC8FC\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uCE74\uD398"],
      installCount: 7,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC625\uC815 \uC2E0\uB3C4\uC2DC \uC911\uC2EC\uC73C\uB85C \uC2E0\uADDC \uB9E4\uC7A5 \uC624\uD508. \uD3EC\uC2A4 \uC218\uC694\uB3C4 \uC810\uCC28 \uC99D\uAC00 \uCD94\uC138.",
      density: "low"
    },
    "\uAD6C\uB9AC\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 8,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC11C\uC6B8 \uADFC\uAD50 \uC8FC\uAC70 \uC0C1\uAD8C. \uB3D9\uB124 \uBC00\uCC29\uD615 \uB9E4\uC7A5 \uBE44\uC911\uC774 \uB192\uC2B5\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uC548\uC131\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 5,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uB18D\uCD0C\xB7\uD0DD\uC9C0\uC9C0\uAD6C \uD63C\uC7AC. \uAE30\uBCF8 \uB2E8\uB9D0\uAE30 \uC124\uCE58\uAC00 \uB300\uBD80\uBD84\uC785\uB2C8\uB2E4.",
      density: "low"
    },
    "\uD3EC\uCC9C\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 5,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uAD00\uAD11 \uC218\uC694\uAC00 \uC788\uB294 \uB18D\uCD0C\uD615 \uC0C1\uAD8C. \uAD00\uAD11\uC9C0 \uB9E4\uC7A5\uC758 \uBB34\uC120 \uB2E8\uB9D0\uAE30 \uC218\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
      density: "low"
    },
    "\uC758\uC655\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uD559\uC6D0", "\uCE74\uD398"],
      installCount: 6,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uB0B4\uC190\uB3D9 \uD559\uC6D0\uAC00 \uC18C\uADDC\uBAA8 \uC0C1\uAD8C. \uD559\uC6D0 POS \uBE44\uC911\uC774 \uAFB8\uC900\uD569\uB2C8\uB2E4.",
      density: "low"
    },
    "\uC591\uD3C9\uAD70": {
      topIndustries: ["\uCE74\uD398", "\uBCA0\uC774\uCEE4\uB9AC", "\uC74C\uC2DD\uC810"],
      installCount: 4,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uAD00\uAD11\uD615 \uB9E4\uC7A5 \uBE44\uC911\uC774 \uB192\uC74C. \uC8FC\uB9D0 \uB9E4\uCD9C \uC9D1\uC911 \uD2B9\uC131\uC73C\uB85C \uBB34\uC120 \uB2E8\uB9D0\uAE30 \uC120\uD638.",
      density: "low"
    },
    "\uC5EC\uC8FC\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 4,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC544\uC6B8\uB81B\xB7\uAD00\uAD11\uC9C0 \uC0C1\uAD8C\uC774 \uC8FC\uCD95. \uACC4\uC808\xB7\uC694\uC77C\uBCC4 \uB9E4\uCD9C \uBCC0\uB3D9\uC774 \uD07D\uB2C8\uB2E4.",
      density: "low"
    },
    "\uB3D9\uB450\uCC9C\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 4,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC18C\uADDC\uBAA8 \uC9C0\uC5ED \uC0C1\uAD8C. \uAE30\uBCF8 \uAD6C\uC131 \uC911\uC2EC\uC73C\uB85C \uC124\uCE58 \uC9C4\uD589\uB429\uB2C8\uB2E4.",
      density: "low"
    },
    "\uACFC\uCC9C\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD559\uC6D0"],
      installCount: 5,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uACF5\uBB34\uC6D0 \uC911\uC2EC\uC758 \uC548\uC815\uC801 \uC0C1\uAD8C. \uC810\uC2EC \uD68C\uC804 \uC704\uC8FC\uC758 \uB9E4\uC7A5 POS\uAC00 \uD2B9\uC9D5.",
      density: "medium"
    },
    "\uAC00\uD3C9\uAD70": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 3,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uAD00\uAD11 \uC131\uC218\uAE30 \uB9E4\uCD9C \uC9D1\uC911. \uC57C\uC678 \uC774\uB3D9 \uACB0\uC81C \uC704\uD55C \uBB34\uC120 \uB2E8\uB9D0\uAE30 \uC218\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
      density: "low"
    },
    "\uC5F0\uCC9C\uAD70": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 2,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC18C\uADDC\uBAA8 \uC2DC\uACE8 \uC0C1\uAD8C. \uAE30\uBCF8 \uC720\uC120 \uB2E8\uB9D0\uAE30 \uC911\uC2EC\uC785\uB2C8\uB2E4.",
      density: "low"
    },
    "\uD30C\uC8FC\uC2DC": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 13,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC6B4\uC815 \uC2E0\uB3C4\uC2DC \uAC1C\uBC1C \uD65C\uBC1C. \uCE74\uD398 \uAC70\uB9AC \uD615\uC131\uC73C\uB85C \uBE0C\uB79C\uB4DC POS \uC218\uC694 \uC99D\uAC00.",
      density: "medium"
    },
    "\uC758\uC815\uBD80\uC2DC": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uD559\uC6D0"],
      installCount: 12,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uBBFC\uB77D\xB7\uD638\uC6D0 \uC8FC\uAC70 \uC0C1\uAD8C \uC911\uC2EC. \uB3D9\uB124 \uBC00\uCC29\uD615 \uB9E4\uC7A5 \uBE44\uC911\uC774 \uB192\uC2B5\uB2C8\uB2E4.",
      density: "medium"
    }
  },
  incheon: {
    "\uC5F0\uC218\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD53C\uD2B8\uB2C8\uC2A4"],
      installCount: 19,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC1A1\uB3C4 \uAD6D\uC81C\uC5C5\uBB34\uC9C0\uAD6C + \uC5F0\uC218 \uC8FC\uAC70 \uC0C1\uAD8C. \uC1A1\uB3C4\uB294 \uD504\uB9AC\uBBF8\uC5C4, \uC5F0\uC218\uB3D9\uC740 \uC0DD\uD65C\uD615 \uB9E4\uC7A5\uC774 \uB9CE\uC74C.",
      density: "high"
    },
    "\uB0A8\uB3D9\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 16,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uAD6C\uC6D4\xB7\uB17C\uD604 \uC0C1\uAD8C \uC911\uC2EC\uC758 \uC9C1\uC7A5\uC778\xB7\uC8FC\uAC70 \uD63C\uC7AC \uC0C1\uAD8C. \uB2E4\uC591\uD55C \uACB0\uC81C\uC218\uB2E8 \uC9C0\uC6D0 \uC911\uC694.",
      density: "medium"
    },
    "\uBD80\uD3C9\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uCE74\uD398"],
      installCount: 14,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uBD80\uD3C9\uC5ED \uC0C1\uAD8C\uACFC \uC8FC\uAC70 \uC0C1\uAD8C \uD63C\uC7AC. \uB300\uB85C\uBCC0 \uB9E4\uC7A5\uC740 POS, \uACE8\uBAA9 \uB9E4\uC7A5\uC740 \uB2E8\uB9D0\uAE30 \uC911\uC2EC.",
      density: "medium"
    },
    "\uC911\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 10,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC778\uCC9C\uACF5\uD56D\xB7\uCC28\uC774\uB098\uD0C0\uC6B4 \uAD00\uAD11 \uC0C1\uAD8C. \uC678\uAD6D\uC778 \uACB0\uC81C\uC218\uB2E8 \uC9C0\uC6D0\uC774 \uD2B9\uD788 \uC911\uC694\uD569\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uC11C\uAD6C": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uD559\uC6D0"],
      installCount: 15,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uCCAD\uB77C\xB7\uAC80\uB2E8 \uC2E0\uB3C4\uC2DC \uAC1C\uBC1C \uC911. \uC2E0\uADDC \uC624\uD508 \uB9E4\uC7A5\uC758 POS \uAD6C\uCD95 \uC218\uC694\uAC00 \uB298\uC5B4\uB098\uB294 \uC911.",
      density: "medium"
    },
    "\uB3D9\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBBF8\uC6A9\uC2E4", "\uBD84\uC2DD\uC9D1"],
      installCount: 5,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC624\uB798\uB41C \uC8FC\uAC70 \uC0C1\uAD8C. \uC2E0\uADDC \uC124\uCE58\uBCF4\uB2E4 \uAD50\uCCB4 \uC218\uC694\uAC00 \uB9CE\uC740 \uD3B8\uC785\uB2C8\uB2E4.",
      density: "low"
    },
    "\uBBF8\uCD94\uD640\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uD559\uC6D0", "\uCE74\uD398"],
      installCount: 11,
      primaryProduct: "\uD3EC\uC2A4\uAE30",
      insight: "\uC8FC\uC548\xB7\uC6A9\uD604 \uC8FC\uAC70\xB7\uD559\uC6D0 \uC0C1\uAD8C. \uD559\uC6D0 POS \uC218\uC694\uAC00 \uAFB8\uC900\uD569\uB2C8\uB2E4.",
      density: "medium"
    },
    "\uACC4\uC591\uAD6C": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uBD84\uC2DD\uC9D1", "\uCE74\uD398"],
      installCount: 9,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uC791\uC804\xB7\uACC4\uC0B0 \uC8FC\uAC70 \uC0C1\uAD8C. \uB3D9\uB124 \uBC00\uCC29\uD615 \uB9E4\uC7A5 \uC911\uC2EC\uC758 \uAE30\uBCF8 \uC124\uCE58\uAC00 \uC8FC\uB958.",
      density: "medium"
    },
    "\uAC15\uD654\uAD70": {
      topIndustries: ["\uCE74\uD398", "\uC74C\uC2DD\uC810", "\uBCA0\uC774\uCEE4\uB9AC"],
      installCount: 3,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uAD00\uAD11\uD615 \uB9E4\uC7A5 \uBE44\uC911 \uB192\uC74C. \uC8FC\uB9D0\xB7\uC131\uC218\uAE30 \uB9E4\uCD9C \uC9D1\uC911 \uD2B9\uC131.",
      density: "low"
    },
    "\uC639\uC9C4\uAD70": {
      topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
      installCount: 2,
      primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
      insight: "\uB3C4\uC11C\uC9C0\uC5ED \uD2B9\uC131\uC0C1 \uCD9C\uC7A5 \uC124\uCE58 \uC77C\uC815 \uC870\uC728\uC774 \uD544\uC218. \uC18C\uADDC\uBAA8 \uB9E4\uC7A5\uC774 \uB300\uBD80\uBD84.",
      density: "low"
    }
  }
};
var defaultDistrictMeta = {
  topIndustries: ["\uC74C\uC2DD\uC810", "\uCE74\uD398", "\uBBF8\uC6A9\uC2E4"],
  installCount: 5,
  primaryProduct: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30",
  insight: "\uD574\uB2F9 \uC9C0\uC5ED\uC758 \uB9E4\uC7A5 \uD2B9\uC131\uC5D0 \uB9DE\uCDB0 \uCD5C\uC801 \uAD6C\uC131\uC744 \uC81C\uC548\uD574\uB4DC\uB9BD\uB2C8\uB2E4.",
  density: "medium"
};
function getDistrictMeta(regionCode, districtSlug) {
  return districtMeta[regionCode]?.[districtSlug];
}

// src/pages/RegionPage.tsx
var RegionPage = ({ region, district, dong, product }) => {
  const level = product ? "dong-product" : dong ? "dong" : district ? "district" : "region";
  const locationLabel = [region.nameKoShort, district?.name, dong?.name].filter(Boolean).join(" ");
  const seed = [region.code, district?.slug, dong?.slug, product?.slug].filter(Boolean).join(":");
  const heroHeadlineTemplate = pickOne(
    level === "district" || level === "region" ? heroHeadlines_district : heroHeadlines_dong,
    seed
  );
  const heroSubcopyTemplate = pickOne(
    level === "district" || level === "region" ? heroSubcopy_district : heroSubcopy_dong,
    seed,
    1
  );
  const heroHeadline = fillTemplate(heroHeadlineTemplate, { location: locationLabel });
  const heroSubcopy = fillTemplate(heroSubcopyTemplate, { location: locationLabel });
  const districtKey = district?.slug || district?.name;
  const meta2 = districtKey ? getDistrictMeta(region.code, districtKey) ?? defaultDistrictMeta : null;
  const patternIdx = seededInt(seed, 99, 0, 4);
  const title2 = product ? `${locationLabel} ${product.name} \uCD9C\uC7A5 \uC124\uCE58 \xB7 \uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4` : `${locationLabel} \uB9E4\uC7A5 \uC124\uBE44 \uC124\uCE58 \xB7 \uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4`;
  const description = product ? `${locationLabel} ${product.name} \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uBC29\uBB38 \uC124\uCE58\uD569\uB2C8\uB2E4. ${meta2?.insight ?? ""}` : `${locationLabel} \uC9C0\uC5ED \uB9E4\uC7A5 \uC124\uBE44 \uCD9C\uC7A5 \uC124\uCE58. ${meta2?.insight ?? ""} \uCE74\uB4DC\uB2E8\uB9D0\uAE30 \xB7 \uD3EC\uC2A4\uAE30 \xB7 \uD0A4\uC624\uC2A4\uD06C \uC6D0\uC2A4\uD1B1.`;
  const canonicalPath = [region.nameKoShort, district?.slug, dong?.slug, product?.slug].filter(Boolean).join("/");
  const currentPath = [region.nameKoShort, district?.slug, dong?.slug].filter(Boolean).join("/");
  const shouldShowInsight = meta2 !== null && (level === "district" || level === "dong" || level === "dong-product");
  const shouldShowInstallRecord = level === "dong" || level === "dong-product";
  const shouldShowFAQ = level === "district" || level === "dong" || level === "dong-product";
  return /* @__PURE__ */ jsxDEV(
    Layout,
    {
      meta: {
        title: title2,
        description,
        canonical: `https://thesavestore.com/${canonicalPath}`
      },
      children: [
        /* @__PURE__ */ jsxDEV(Navigation, {}),
        (() => {
          const items = [{ name: "\uD648", url: "/" }];
          const isLast_region = !district && !dong && !product;
          items.push({
            name: region.nameKo,
            url: isLast_region ? void 0 : `/${region.nameKoShort}`
          });
          if (district) {
            const isLast_district = !dong && !product;
            items.push({
              name: district.name,
              url: isLast_district ? void 0 : `/${region.nameKoShort}/${district.slug}`
            });
          }
          if (dong) {
            const isLast_dong = !product;
            items.push({
              name: dong.name,
              url: isLast_dong ? void 0 : `/${region.nameKoShort}/${district.slug}/${dong.slug}`
            });
          }
          if (product) {
            items.push({ name: product.name });
          }
          return /* @__PURE__ */ jsxDEV(Breadcrumb, { items });
        })(),
        /* @__PURE__ */ jsxDEV("section", { class: "page-header", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: level === "dong-product" ? `${dong.name} \xB7 ${product.name}` : level === "dong" ? `${district.name} ${dong.name}` : level === "district" ? region.nameKo : "REGION" }),
          /* @__PURE__ */ jsxDEV(
            "h1",
            {
              style: "font-size: clamp(40px, 5.2vw, 72px); font-weight: 900; letter-spacing: -0.05em; line-height: 1.05; margin-bottom: 20px; color: var(--black); white-space: pre-line;",
              children: product ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                locationLabel,
                "\n",
                /* @__PURE__ */ jsxDEV("span", { style: "color: var(--orange);", children: [
                  product.name,
                  " \uC124\uCE58."
                ] })
              ] }) : heroHeadline.split("\n").map(
                (line, i) => i === heroHeadline.split("\n").length - 1 ? /* @__PURE__ */ jsxDEV("span", { style: "color: var(--orange);", children: line }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                  line,
                  "\n"
                ] })
              )
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "p",
            {
              style: "font-size: 17px; color: var(--muted); line-height: 1.7; max-width: 560px; font-weight: 300; margin-bottom: 32px;",
              children: product ? `${locationLabel} \uC9C0\uC5ED ${product.name} \uC804\uBB38 \uB9E4\uB2C8\uC800\uAC00 \uC9C1\uC811 \uBC29\uBB38 \uC124\uCE58\uD569\uB2C8\uB2E4. ${meta2?.insight ?? ""}` : heroSubcopy
            }
          ),
          /* @__PURE__ */ jsxDEV("div", { class: "hero-ctas", children: [
            /* @__PURE__ */ jsxDEV("a", { href: "/#contact", class: "btn btn-primary", children: "\uBB34\uB8CC \uACAC\uC801 \uBC1B\uAE30 \u2192" }),
            /* @__PURE__ */ jsxDEV("a", { href: "tel:010-9677-2356", class: "btn btn-outline", children: "\u{1F4DE} 010-9677-2356" })
          ] }),
          level === "region" && /* @__PURE__ */ jsxDEV("div", { class: "hero-stats", style: "margin-top: 40px;", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { class: "stat-num", children: [
                region.districtCount,
                /* @__PURE__ */ jsxDEV("span", { class: "unit", children: "." })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "stat-label", children: region.code === "gyeonggi" ? "\uC2DC\uAD70" : region.code === "incheon" ? "\uAD70\uAD6C" : "\uC790\uCE58\uAD6C" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { class: "stat-num", children: [
                region.dongCount,
                /* @__PURE__ */ jsxDEV("span", { class: "unit", children: "." })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "stat-label", children: region.code === "seoul" ? "\uD589\uC815\uB3D9" : "\uC74D\uBA74\uB3D9" })
            ] })
          ] })
        ] }) }),
        level === "region" && /* @__PURE__ */ jsxDEV("section", { style: "padding: 80px 0; background: var(--white); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "DISTRICTS" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            region.nameKo,
            " ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC2DC\uAD70\uAD6C\uBCC4 \uC0C1\uC138." })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;", children: region.districts.map((d) => /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `/${region.nameKoShort}/${d.slug}`,
              style: "background: var(--white); border: 0.5px solid var(--line); border-radius: 16px; padding: 22px 20px; text-decoration: none; color: var(--black); display: flex; flex-direction: column; gap: 4px;",
              children: [
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    style: "font-size: 16px; font-weight: 800; letter-spacing: -0.03em;",
                    children: d.name
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    style: "font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; color: var(--muted); font-weight: 500; letter-spacing: 0.05em;",
                    children: [
                      d.dongs.length,
                      "\uAC1C \uC9C0\uC5ED"
                    ]
                  }
                )
              ]
            }
          )) })
        ] }) }),
        level === "district" && district && /* @__PURE__ */ jsxDEV("section", { style: "padding: 80px 0; background: var(--white); border-top: 0.5px solid var(--line);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "sec-label", children: "DONG" }),
          /* @__PURE__ */ jsxDEV("h2", { class: "sec-title", children: [
            district.name,
            " ",
            /* @__PURE__ */ jsxDEV("span", { class: "emph", children: "\uC74D\uBA74\uB3D9\uBCC4 \uC0C1\uC138." })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;", children: district.dongs.map((dng) => /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `/${region.nameKoShort}/${district.slug}/${dng.slug}`,
              style: "background: var(--white); border: 0.5px solid var(--line); border-radius: 16px; padding: 20px 18px; text-decoration: none; color: var(--black); font-size: 15px; font-weight: 700; letter-spacing: -0.03em;",
              children: dng.name
            }
          )) })
        ] }) }),
        shouldShowInsight && meta2 && /* @__PURE__ */ jsxDEV(LocalInsight, { locationLabel, meta: meta2, seed }),
        (level === "dong" || level === "dong-product") && /* @__PURE__ */ jsxDEV(CoreProducts, { locationPath: currentPath }),
        shouldShowInstallRecord && /* @__PURE__ */ jsxDEV(InstallRecord, { seed, locationLabel }),
        /* @__PURE__ */ jsxDEV(BusinessConfig, { locationLabel }),
        /* @__PURE__ */ jsxDEV(InstallSteps, {}),
        patternIdx === 0 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          shouldShowFAQ && /* @__PURE__ */ jsxDEV(FAQ, { seed, locationLabel }),
          /* @__PURE__ */ jsxDEV(Industries, {})
        ] }),
        patternIdx === 1 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV(Industries, {}),
          shouldShowFAQ && /* @__PURE__ */ jsxDEV(FAQ, { seed, locationLabel })
        ] }),
        patternIdx === 2 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV(Industries, {}),
          shouldShowFAQ && /* @__PURE__ */ jsxDEV(FAQ, { seed, locationLabel })
        ] }),
        patternIdx === 3 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          shouldShowFAQ && /* @__PURE__ */ jsxDEV(FAQ, { seed, locationLabel }),
          /* @__PURE__ */ jsxDEV(Industries, {})
        ] }),
        /* @__PURE__ */ jsxDEV(CTA, {}),
        /* @__PURE__ */ jsxDEV(Footer, {}),
        /* @__PURE__ */ jsxDEV(FloatingPhone, {})
      ]
    }
  );
};

// src/index.tsx
var app = new Hono2();
app.get(
  "/robots.txt",
  (c) => c.text(
    [
      "User-agent: *",
      "Allow: /",
      "",
      "Sitemap: https://thesavestore.com/sitemap.xml"
    ].join("\n"),
    200,
    { "Content-Type": "text/plain; charset=utf-8" }
  )
);
app.get("/sitemap.xml", (c) => {
  const base = "https://thesavestore.com";
  const entries = [];
  const buildUrl = (...segments) => {
    return base + "/" + segments.map((s) => encodeURIComponent(s)).join("/");
  };
  entries.push({ url: base + "/", priority: "1.0", changefreq: "weekly" });
  for (const p of products) {
    entries.push({
      url: buildUrl("\uC81C\uD488", p.slug),
      priority: "0.9",
      changefreq: "monthly"
    });
  }
  for (const i of industries) {
    entries.push({
      url: buildUrl("\uC5C5\uC885", i.slug),
      priority: "0.8",
      changefreq: "monthly"
    });
  }
  for (const r of regions) {
    entries.push({
      url: buildUrl(r.nameKoShort),
      priority: "0.7",
      changefreq: "monthly"
    });
    for (const d of r.districts) {
      entries.push({
        url: buildUrl(r.nameKoShort, d.slug),
        priority: "0.6",
        changefreq: "monthly"
      });
      for (const dong of d.dongs) {
        entries.push({
          url: buildUrl(r.nameKoShort, d.slug, dong.slug),
          priority: "0.5",
          changefreq: "monthly"
        });
        for (const p of products) {
          entries.push({
            url: buildUrl(r.nameKoShort, d.slug, dong.slug, p.slug),
            priority: "0.4",
            changefreq: "monthly"
          });
        }
      }
    }
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.map(
    (e) => `  <url><loc>${e.url}</loc><lastmod>${today}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
  ).join("\n") + "\n</urlset>";
  return c.text(xml, 200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600"
  });
});
app.get("/", (c) => c.html(/* @__PURE__ */ jsxDEV(HomePage, {})));
app.get("/\uC81C\uD488/:slug", (c) => {
  const slug = c.req.param("slug");
  const product = findProduct(slug);
  if (!product) {
    return c.notFound();
  }
  return c.html(/* @__PURE__ */ jsxDEV(ProductPage, { product }));
});
app.get("/\uC5C5\uC885/:slug", (c) => {
  const slug = c.req.param("slug");
  const industry = findIndustry(slug);
  if (!industry) {
    return c.notFound();
  }
  return c.html(/* @__PURE__ */ jsxDEV(IndustryPage, { industry }));
});
app.get("/:region", (c) => {
  const regionSlug = c.req.param("region");
  const { region } = resolveRegionPath(regionSlug);
  if (!region)
    return c.notFound();
  return c.html(/* @__PURE__ */ jsxDEV(RegionPage, { region }));
});
app.get("/:region/:district", (c) => {
  const { region, district } = resolveRegionPath(
    c.req.param("region"),
    c.req.param("district")
  );
  if (!region || !district)
    return c.notFound();
  return c.html(/* @__PURE__ */ jsxDEV(RegionPage, { region, district }));
});
app.get("/:region/:district/:dong", (c) => {
  const { region, district, dong } = resolveRegionPath(
    c.req.param("region"),
    c.req.param("district"),
    c.req.param("dong")
  );
  if (!region || !district || !dong)
    return c.notFound();
  return c.html(/* @__PURE__ */ jsxDEV(RegionPage, { region, district, dong }));
});
app.get("/:region/:district/:dong/:product", (c) => {
  const { region, district, dong } = resolveRegionPath(
    c.req.param("region"),
    c.req.param("district"),
    c.req.param("dong")
  );
  if (!region || !district || !dong)
    return c.notFound();
  const product = findProduct(c.req.param("product"));
  if (!product)
    return c.notFound();
  return c.html(
    /* @__PURE__ */ jsxDEV(RegionPage, { region, district, dong, product })
  );
});
app.notFound((c) => {
  return c.html(
    /* @__PURE__ */ jsxDEV("html", { lang: "ko", children: [
      /* @__PURE__ */ jsxDEV("head", { children: [
        /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
        /* @__PURE__ */ jsxDEV("title", { children: "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4 \xB7 \uB354\uC138\uC774\uBE0C \uC2A4\uD1A0\uC5B4" }),
        /* @__PURE__ */ jsxDEV(
          "style",
          {
            dangerouslySetInnerHTML: {
              __html: `
            body { font-family: -apple-system, sans-serif; padding: 80px 20px; text-align: center; background: #fff; color: #000; }
            h1 { font-size: 72px; font-weight: 900; color: #FF5500; margin-bottom: 16px; letter-spacing: -0.05em; }
            p { color: #666; margin-bottom: 32px; }
            a { display: inline-block; background: #FF5500; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 2px; font-weight: 700; }
          `
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxDEV("body", { children: [
        /* @__PURE__ */ jsxDEV("h1", { children: "404" }),
        /* @__PURE__ */ jsxDEV("p", { children: "\uC694\uCCAD\uD558\uC2E0 \uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }),
        /* @__PURE__ */ jsxDEV("a", { href: "/", children: "\uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30" })
      ] })
    ] }),
    404
  );
});
// ============================================================
// 콘텐츠 부스터 v2
// ============================================================
const __POOL_CARD = [
'{loc} 매장에서 카드단말기 설치 시 가장 먼저 확인할 것은 VAN사별 수수료 차이입니다.',
'{loc} 사장님들이 매년 가장 큰 비용 절감을 보는 항목이 카드 결제 수수료입니다.',
'{loc} 매장 5년 차 사장님 사례를 보면 VAN사 변경만으로 월 47만원 절약하셨습니다.',
'{loc}에서 점포를 새로 여시는 분이라면 IC·MST·QR 모두 지원 단말기를 권장드립니다.',
'{loc} 권역 평균 결제 패턴을 보면 카드 78%, 간편결제 18%, 현금 4% 분포입니다.',
'결제 단말기 한 대가 매장 매출 100%를 처리한다는 점에서 {loc} 단말기 선택은 결정적입니다.',
'{loc} 인근 카페에서 자주 발생하는 결제 거절 사례는 대부분 통신 불안정 탓입니다.',
'{loc} 식당가에서는 무선보다 유선 단말기가 안정성 면에서 선호되는 경향이 있습니다.',
'{loc} 야간 영업 매장에서 자동커팅 단말기를 도입하면 영수증 정리 시간 30% 단축됩니다.',
'{loc} 매장 사장님 한 분은 VAN 변경 후 1년 절약한 금액으로 인테리어를 새로 했습니다.',
'{loc} 인근 미용실에서는 시술 자리 결제 위해 무선 블루투스 단말기를 선호합니다.',
'{loc} 신축 상가 매장은 인터넷 회선이 안정적이라 어떤 단말기든 무리 없이 운용됩니다.',
'{loc} 외곽 지역에서는 통신 음영지역이 있을 수 있어 사전 매장 점검이 필수입니다.',
'{loc} 외국인 고객 비중 높은 매장은 해외 카드 승인 대응 단말기로 설치합니다.',
'{loc} 매장의 주말 매출이 평일보다 높다면 처리 속도 빠른 모델을 추천드립니다.',
'{loc} 권역 편의점에서는 24시간 운영 특성상 내구성 좋은 단말기가 핵심입니다.',
'{loc} 학원가 매장은 학기 시작 시즌 결제 빈도 폭증해 이중 단말기 구성을 권장합니다.',
'{loc} 시장 안 매장은 노후 회선 문제로 LTE 백업 기능 단말기가 안정적입니다.',
'{loc}에서 중고 단말기를 받아 쓰면 보안 인증 만료 위험이 있어 신중하셔야 합니다.',
'{loc} 매장 단말기 출장 설치 평균 소요 시간은 28분이며 영업 중에도 진행됩니다.',
'{loc} 사장님이 가장 자주 묻는 질문은 "수수료가 정말 줄어드냐"는 것입니다.',
'{loc} 권역 가맹점 평균 카드 수수료 1.95%이며 비교 견적으로 1.5%대까지 인하됩니다.',
'{loc} 외식업 사장님은 회전율이 매출에 직결되므로 결제 속도를 우선 고려합니다.',
'{loc} 미용·뷰티 업종에서는 부분 결제·예약금 처리 가능한 단말기가 효율적입니다.',
'{loc} 의류·잡화 매장은 환불 처리 빈도가 높아 단말기 메뉴 구성이 중요합니다.',
'{loc} 인근 PC방·노래방은 시간 단위 결제가 잦아 자동 영수증 출력이 필수입니다.',
'{loc} 야시장·푸드트럭은 모바일 결제 단말기로 즉시 결제가 가능합니다.',
'{loc} 동네 빵집 사장님은 매일 영업 시작 전 단말기 통신 점검을 습관화합니다.',
'{loc} 인근 헬스장·필라테스 매장은 정기결제·자동결제 기능 단말기를 선호합니다.',
'{loc} 권역 학원·교습소는 학생별 결제 분리·증빙 발급이 자주 요구됩니다.',
'{loc} 매장에서 새벽 시간대 결제 오류 발생 시 매출 누락으로 이어질 위험 있습니다.',
'{loc} 권역에서 가장 흔한 단말기 고장 원인은 어댑터·케이블 노후입니다.',
'{loc} 매장에서 단말기 교체 시 기존 영수증 용지·롤지를 그대로 쓰실 수 있습니다.',
'{loc} 권역 평균 단말기 사용 연한은 4년 4개월, 그 후 교체가 권장됩니다.',
'{loc} 동네 매장에서는 단말기 옆 콘센트·USB 포트 위치도 미리 확인해야 합니다.',
'{loc} 매장 결제 자리는 카운터 좌측보다 우측이 손님 동선상 자연스럽습니다.',
'{loc}에서 단말기 도난 사고 시 즉시 VAN사 통보로 결제 차단이 가능합니다.',
'{loc} 권역 결제 데이터 보안 표준은 PCI-DSS Level 1이며 모든 추천 모델이 충족합니다.',
'{loc} 매장 90% 이상이 IC·MST 겸용 단말기를 사용 중입니다.',
'{loc}에서 결제 거절 1건당 매장 매출 손실은 평균 1만 2천원입니다.'
];

const __POOL_POS = [
'{loc} 매장에서 포스기 도입 후 가장 자주 보고되는 변화는 마감 시간 단축입니다.',
'{loc} 사장님 사례 중 배달앱 통합 포스기로 주문 누락이 사라진 경우가 많습니다.',
'{loc} 식당가에서는 테이블 회전율이 매출에 직결되므로 빠른 주문 처리가 핵심입니다.',
'{loc} 카페·디저트 매장은 단가 변경이 잦아 메뉴 즉시 반영 가능한 포스가 필수입니다.',
'{loc} 권역 다점포 운영 사장님은 본사-매장 통합 매출 관리 기능을 가장 많이 활용합니다.',
'{loc} 매장 직원의 출퇴근·매출 권한 분리는 포스기 권한 설정으로 간단히 처리됩니다.',
'{loc}에서 세무사 비용 절감 위해 매출 자동 리포트 기능을 도입하는 매장이 늘고 있습니다.',
'{loc} 권역 평균 포스기 도입 후 인건비 효과는 월 25~40만원 절감 수준입니다.',
'{loc} 매장에서 재고 자동 차감 기능은 작은 매장에서도 큰 시간 절약 효과가 있습니다.',
'{loc} 사장님이 외부 출장 잦다면 클라우드 동기화 포스가 운영 부담을 줄여줍니다.',
'{loc} 권역 포스기 평균 도입 비용은 월 0~3만원 수준이며 일반형은 무상 임대도 가능합니다.',
'{loc} 매장에 포스기 설치 시 메뉴 등록 평균 소요 시간은 35분입니다.',
'{loc} 사장님이 가장 자주 활용하는 포스 기능은 일별 매출 리포트입니다.',
'{loc} 권역 식당의 70%가 배달앱 자동 주문 수신 기능을 활용하고 있습니다.',
'{loc} 매장 매출 패턴 분석은 포스기 도입 1개월 후부터 의미 있는 데이터가 쌓입니다.',
'{loc}에서 포스기 데이터를 매장 운영 결정에 활용하는 사장님이 점차 늘고 있습니다.',
'{loc} 권역 카페에서는 단골 고객 적립 기능으로 재방문율을 높이는 사례가 많습니다.',
'{loc} 매장 사장님이 메뉴 변경 시 즉시 모든 단말기에 반영되는 점이 큰 편의로 평가됩니다.',
'{loc} 프랜차이즈 가맹점은 본사 통합 포스로 매출 자동 보고가 가능합니다.',
'{loc} 권역 포스기는 클라우드 백업으로 데이터 손실 위험이 사실상 0에 가깝습니다.',
'{loc} 매장에서 임시 대체기 무료 지원으로 영업 중단 시간이 최소화됩니다.',
'{loc}에서 포스기 권장 교체 주기는 5~7년이며 그 후에도 연장 사용 가능합니다.',
'{loc} 권역 평균 포스 단말기 사용 만족도는 87%로 안정적인 수준입니다.',
'{loc} 매장에 포스 도입 시 직원 사용법 교육은 30~60분이면 충분합니다.',
'{loc} 사장님은 포스기 화면 위치를 카운터 동선에 맞춰 조정하실 수 있습니다.',
'{loc} 권역에서 가장 자주 추가되는 옵션은 영수증 프린터와 캐시 드로어입니다.',
'{loc} 매장 객단가 분석은 포스기 데이터로 일·주·월 단위 추적 가능합니다.',
'{loc}에서 시간대별 매출 변화를 보면 매장 운영 효율이 명확히 드러납니다.',
'{loc} 권역 매장 직원 권한 분리는 매출 정보 보안과 직원 신뢰 모두에 도움됩니다.',
'{loc} 매장에서 단골 고객 데이터는 마케팅 활용에 가장 큰 자산입니다.',
'{loc}에서 포스기와 카드단말기 통합 영수증 발행이 표준 운영 방식입니다.',
'{loc} 권역 평균 포스 단말기 응답 속도는 0.3초로 매장 회전율에 영향을 주지 않습니다.',
'{loc} 매장 사장님은 포스 메뉴 구성을 직접 수정하실 수 있어 운영 자율성이 보장됩니다.',
'{loc}에서 포스기 정기 점검은 무상으로 6개월 주기로 진행됩니다.',
'{loc} 권역 포스 단말기 무상 A/S 평균 출동 시간은 1시간 이내입니다.'
];

const __POOL_CCTV = [
'{loc} 매장 CCTV 설치 시 가장 먼저 분석할 것은 사각지대입니다.',
'{loc} 권역에서 야간 영업 매장은 적외선 카메라가 사실상 필수입니다.',
'{loc} 매장 도난 사고의 70%는 새벽 1~5시 사이에 발생하는 통계가 있습니다.',
'{loc}에서 카메라 화질이 낮아 사고 발생 시 영상 추출이 무용지물 된 사례가 적지 않습니다.',
'{loc} 사장님 사례 중 CCTV 설치 후 도난 빈도가 90% 이상 줄어든 경우도 있습니다.',
'{loc} 매장 카메라 위치는 입구·카운터·창고·주방을 모두 커버해야 합니다.',
'{loc} 권역 평균 매장 면적 10평당 카메라 1.5대가 적정 설치 기준입니다.',
'{loc} 매장에 4K 카메라 1대가 풀HD 카메라 4대보다 효율적인 경우가 많습니다.',
'{loc}에서 CCTV 클라우드 녹화는 NVR 분실 위험을 0으로 만드는 핵심 옵션입니다.',
'{loc} 권역 카메라 평균 사용 수명은 6년 7개월, 보증 기간은 1년이 표준입니다.',
'{loc} 매장 사장님이 가장 자주 보는 영상은 매출 마감 시간대 카운터 영상입니다.',
'{loc} 인근 CCTV 출장 점검 평균 출동 시간은 53분, 24시간 콜센터 운영입니다.',
'{loc} 권역 카메라 무상 A/S 빈도는 1년에 1.2회 미만으로 안정적입니다.',
'{loc}에서 매장 CCTV 사각지대 분석은 도면이나 사진만으로도 사전에 가능합니다.',
'{loc} 사장님은 CCTV 견적 받기 전에 매장 운영 시간을 명확히 알려주시는 것이 좋습니다.',
'{loc} 매장 업종을 알려주시면 비슷한 사례 데이터를 함께 보여드립니다.',
'{loc}에서 신규 오픈 매장과 기존 매장 교체는 진행 절차가 다릅니다.',
'{loc} 권역 카메라 야간 화질은 적외선 거리 15m가 표준입니다.',
'{loc} 매장에서 카메라 각도는 천장 모서리 45도가 가장 넓은 시야를 확보합니다.',
'{loc} 모바일 원격 모니터링은 어디서나 매장 영상을 실시간 확인할 수 있게 해줍니다.',
'{loc} 권역 매장 사장님 70%가 매일 1회 이상 모바일로 매장을 체크합니다.',
'{loc} CCTV 영상 보관 기간은 최소 7일, 권장 30일, 클라우드 옵션으로 60일까지 가능합니다.',
'{loc} 매장에서 도난·사고 발생 시 영상 추출 평균 소요 시간은 3분입니다.',
'{loc} 경찰 수사 협조 영상 발급은 24시간 콜센터 통해 즉시 진행됩니다.',
'{loc} 권역 평균 CCTV 도입 비용은 카메라 1대당 15~25만원, 매장당 80~150만원 수준입니다.',
'{loc} 매장 사장님이 CCTV로 직원 근태를 확인하는 사례가 점차 늘고 있습니다.',
'{loc}에서 화재·연기 자동 감지 옵션은 안전과 보험료 모두에 도움됩니다.',
'{loc} 권역 매장 카메라 정기 청소는 6개월 주기가 권장됩니다.',
'{loc} 매장 입구 카메라는 손님 인식과 도난 방지에 가장 효과적입니다.',
'{loc}에서 카운터 카메라는 매출 정산 시 분쟁 예방에 유용합니다.',
'{loc} 권역 매장에서 카메라 알림 푸시 기능을 활성화한 사장님이 많습니다.',
'{loc} 매장에서 화재 감지 카메라는 일반 화재경보기와 병행 설치 시 안전성이 배가됩니다.',
'{loc} AI 분석 카메라는 동선 분석으로 매장 효율 개선 데이터를 제공합니다.',
'{loc} 권역 카메라 설치 후 직원 근무 태도가 개선된 사례가 많이 보고됩니다.',
'{loc} 매장에서 CCTV는 단순 보안이 아니라 매장 운영 인사이트 도구입니다.'
];

const __POOL_OP = [
'{loc} 매장 운영비 따질 때 장비 비용보다 운영 절감 효과를 함께 봐야 정확합니다.',
'{loc} 평균 매장 임대료·인건비 대비 장비 비용 비중은 5% 미만입니다.',
'{loc} 권역 매장 매출 100%를 처리하는 도구라는 점에서 장비 선택은 가볍지 않습니다.',
'{loc}에서 가장 저렴한 장비가 가장 좋은 선택은 아닌 경우가 많습니다.',
'{loc} 매장 사장님 후회 사례 1위는 "초기에 너무 비싼 모델을 골랐다"입니다.',
'{loc}에서 매장 규모와 업종에 맞춰 적정 사양 선택 시 초기 비용 30~50% 줄일 수 있습니다.',
'{loc} 권역 일 매출 50만원 이상 매장은 포스기 도입 효과가 큽니다.',
'{loc} 매장 평수 10평 이상 또는 야간 영업 있다면 CCTV는 필수입니다.',
'{loc}에서 카드단말기는 매장 오픈과 동시에 설치하는 것이 일반적입니다.',
'{loc} 매장 운영 잘하는 사장님 공통점은 "장비 의존도를 명확히 한다"는 것입니다.',
'{loc}에서 한 장비로 여러 기능을 욕심내면 결국 모든 기능이 어중간해집니다.',
'{loc} 매장 운영 시 결제 시스템 오류로 단골을 놓친 경험 한 번쯤은 있으실 겁니다.',
'{loc} 권역 결제 단말기 이중화는 사고 시 매출 손실을 0에 가깝게 줄여줍니다.',
'{loc}에서 사고 안 나는 게 가장 좋지만 나더라도 매출 손실 최소화 구조가 진짜 안정성입니다.',
'{loc} 매장 사장님이라면 정기 점검·소프트웨어 업데이트를 6개월 주기로 권장드립니다.',
'{loc} 권역 정기 점검은 무상으로 진행되며 추가 비용이 발생하지 않습니다.',
'{loc} 매장에서 단말기·포스·CCTV 통합 점검 시 평균 소요 시간 1시간 30분입니다.',
'{loc} 사장님은 매장 영업 시간 외에도 점검 일정을 협의하실 수 있습니다.',
'{loc} 권역 점검 후 보고서는 카톡·이메일로 발송됩니다.',
'{loc} 매장에서 자주 묻는 질문은 "계약 기간이 정해져 있냐"는 것입니다.',
'{loc}에서 단말기·포스는 보통 36개월 무상 임대 조건이며 중도 해지 위약금이 최소화되어 있습니다.',
'{loc} 권역 CCTV는 구매형으로 장기 계약이 없습니다.',
'{loc} 매장 사장님은 사업자 매입 영수증 받으실 수 있으며 부가세 환급도 가능합니다.',
'{loc}에서 매장 오픈 일정에 맞춘 설치 일정 조율은 어떤 시기든 가능합니다.',
'{loc} 권역 24시간 콜센터는 카톡·전화·문자 모든 채널로 응답합니다.',
'{loc} 매장 사장님이 5,000곳 이상의 설치 데이터를 함께 보실 수 있는 기회입니다.',
'{loc}에서 견적 비교 한 번으로 연간 수백만원 차이가 나는 경우도 있습니다.',
'{loc} 권역 매장 평균 운영비 절감 효과는 월 70~120만원 수준입니다.',
'{loc} 매장 운영 베테랑 사장님들은 장비 점검을 매장 일과의 일부로 두고 있습니다.',
'{loc}에서 매장 보안과 운영 효율을 동시에 챙기려면 통합 시스템 구성이 효율적입니다.'
];

const __POOL_CASE = [
'{loc} 권역 한 카페 사장님은 단말기 수수료가 비싸다고 느끼면서도 손대지 못해 4년간 그대로 두셨습니다.',
'{loc}에서 견적 비교 후 VAN사를 변경한 결과 같은 단말기·같은 패턴인데 월 수수료 38만원 줄었습니다.',
'{loc} 한 식당은 배달앱 주문을 직원이 일일이 태블릿에서 확인하던 구조였는데 배달 연동 포스 도입 후 주문 누락이 사라졌습니다.',
'{loc} 한 편의점 사장님은 새벽 시간 도난 사고 후 CCTV를 4K로 다시 설치하셨습니다.',
'{loc} 한 미용실은 직원 3명·예약제 운영이라 결제가 카운터에 몰리는 구조였습니다.',
'{loc} 권역 한 학원 사장님은 학기별 수강료 결제 데이터 자동 정리를 가장 만족하셨습니다.',
'{loc}에서 한 베이커리는 새벽 영업 시간대 매출 데이터로 직원 스케줄을 최적화했습니다.',
'{loc} 한 PC방은 시간 단위 결제 자동화로 카운터 직원 업무량을 50% 줄였습니다.',
'{loc} 권역 한 헬스장은 정기결제 자동 처리로 미수금 발생 빈도를 1/10로 낮췄습니다.',
'{loc} 한 옷가게 사장님은 환불 처리 자동화로 고객 응대 시간을 절반으로 줄였습니다.',
'{loc}에서 한 분식집은 점심시간 회전율이 30% 향상되어 매출이 늘었습니다.',
'{loc} 권역 한 치킨집은 배달앱 통합으로 야간 매출 누락 사고가 사라졌습니다.',
'{loc} 한 카페 매장은 적립 카드 시스템으로 단골 비중을 40%까지 높였습니다.',
'{loc}에서 한 마트는 재고 자동 차감으로 발주 누락이 사라졌습니다.',
'{loc} 권역 한 무인매장은 CCTV 원격 모니터링으로 인건비 0원 운영을 실현했습니다.',
'{loc} 한 노래방은 시간 단위 결제 자동화로 매출 누락이 사라졌습니다.',
'{loc}에서 한 학원의 결제 분쟁 사례는 영상 자료 확보로 즉시 해결되었습니다.',
'{loc} 권역 한 식당의 단골 고객은 자동 적립 시스템으로 재방문이 2배 늘었습니다.',
'{loc} 한 매장의 야간 침입 시도는 CCTV 알림으로 즉시 차단되었습니다.',
'{loc}에서 한 사장님은 출장 잦은 운영 패턴이라 클라우드 동기화 포스가 핵심이었습니다.',
'{loc} 권역 한 다점포 운영 사장님은 본사-매장 통합 매출로 한눈에 운영을 파악합니다.',
'{loc} 한 개인 사업자는 세무사 비용을 자동 매출 리포트로 30% 절감했습니다.',
'{loc}에서 한 매장은 직원 근태 분쟁을 CCTV 영상으로 빠르게 해결했습니다.',
'{loc} 권역 한 카페의 단골 고객 데이터는 마케팅 효과를 200% 향상시켰습니다.',
'{loc} 한 매장 사장님은 도난 사고 후 카메라를 4K로 교체하면서 보험료 인하 혜택을 받았습니다.',
'{loc}에서 한 미용실은 시술 자리 결제로 카운터 대기 시간이 사라졌습니다.',
'{loc} 권역 한 분식집은 점심·저녁 메뉴 차이를 데이터로 분석해 객단가를 높였습니다.',
'{loc} 한 매장은 시간대별 매출 분석으로 직원 스케줄을 최적화했습니다.',
'{loc}에서 한 매장의 화재 감지 카메라는 초기 화재 사고를 1분 만에 알려 피해를 막았습니다.',
'{loc} 권역 한 매장은 단말기 이중화로 영업 중단 시간 0을 달성했습니다.'
];

const __SYNONYMS = [
['매장','사업장','점포','가게'],
['사장님','대표님','점주님','오너님'],
['설치','시공','도입','구축'],
['출장','방문','현장','직접'],
['전문','전담','베테랑','숙련'],
['빠르게','신속히','즉시','곧바로'],
['저렴한','낮은','경제적인','합리적인'],
['안정적','신뢰성 있는','튼튼한','믿을 수 있는'],
['처리','진행','수행','완료'],
['확인','점검','검토','체크'],
['선택','결정','고르기','결단'],
['변경','전환','교체','바꾸기'],
['절약','절감','아끼기','줄이기'],
['효율적','효과적','능률적','경제적'],
['중요','핵심','필수','관건'],
['추천','권장','제안','안내'],
['고객','손님','소비자','이용자'],
['운영','경영','관리','운용'],
['제공','지원','공급','드림'],
['사용','이용','활용','쓰기']
];

const __SECTION_LABELS = ['운영 인사이트','매장 운영 노트','설치 가이드','실무 팁','운영 데이터','권역 분석','도입 효과','현장 정보','운영 사례','점검 가이드','매장 운영 백서','운영 노하우','실전 팁','운영 점검표','도입 후기'];
const __H2_TEMPLATES = ['{loc} 매장 운영 가이드','{loc}에서 자주 보는 운영 패턴','{loc} 매장 사장님이 알아야 할 정보','{loc} 권역 매장 운영 데이터','{loc} 지역 매장 설치 인사이트','{loc}의 매장 운영 노하우','{loc} 매장 사장님이 자주 묻는 정보','{loc} 권역 매장 분석','{loc}에서 매장을 운영하시는 분들을 위한 안내','{loc} 지역 매장 설치 가이드'];

function __boostHash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h;}
function __boostPick(arr,seed,salt,n){const used=new Set();const out=[];let i=0;const lim=arr.length*4;while(out.length<n&&i<lim){const idx=__boostHash(seed+':'+salt+':'+i)%arr.length;if(!used.has(idx)){used.add(idx);out.push(arr[idx]);}i++;}return out;}
function __applySynonyms(text,seed,idx){let r=text;for(let i=0;i<__SYNONYMS.length;i++){const g=__SYNONYMS[i];const pi=__boostHash(seed+':syn:'+idx+':'+i)%g.length;const t=g[pi];const o=g[0];if(t===o)continue;if(__boostHash(seed+':apply:'+idx+':'+i)%100<65)r=r.split(o).join(t);}return r;}
function __shuffleBySeed(a,seed){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=__boostHash(seed+':sh:'+i)%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;}

function __generateBooster(pathname){
  const decoded=decodeURIComponent(pathname);
  const segs=decoded.split('/').filter(Boolean);
  let loc='전국';
  if(segs.length>=3)loc=segs[2];
  else if(segs.length>=2)loc=segs[1];
  else if(segs.length>=1&&!decoded.startsWith('/제품'))loc=segs[0];
  const seed=decoded;
  const card=__boostPick(__POOL_CARD,seed,'card',6);
  const pos=__boostPick(__POOL_POS,seed,'pos',6);
  const cctv=__boostPick(__POOL_CCTV,seed,'cctv',6);
  const op=__boostPick(__POOL_OP,seed,'op',5);
  const cas=__boostPick(__POOL_CASE,seed,'cas',5);
  const all=[...card,...pos,...cctv,...op,...cas];
  const shuf=__shuffleBySeed(all,seed);
  const ps=shuf.map((p,i)=>{let t=p.replace(/\{loc\}/g,loc);t=__applySynonyms(t,seed,i);return `<p style="font-size:15px;line-height:1.85;color:#222;margin-bottom:14px;max-width:780px">${t}</p>`;});
  const half=Math.floor(ps.length/2);
  const p1=ps.slice(0,half).join('');
  const p2=ps.slice(half).join('');
  const l1=__SECTION_LABELS[__boostHash(seed+':lbl1')%__SECTION_LABELS.length];
  const l2=__SECTION_LABELS[__boostHash(seed+':lbl2')%__SECTION_LABELS.length];
  const h2a=__H2_TEMPLATES[__boostHash(seed+':h2a')%__H2_TEMPLATES.length].replace(/\{loc\}/g,loc);
  const h2b=__H2_TEMPLATES[__boostHash(seed+':h2b')%__H2_TEMPLATES.length].replace(/\{loc\}/g,loc);
  return `<section style="padding:48px 0;border-top:0.5px solid #EEE;background:#fff"><div style="max-width:1240px;margin:0 auto;padding:0 28px"><div style="font-size:11px;font-weight:700;letter-spacing:0.2em;color:#FF5500;margin-bottom:14px">${l1.toUpperCase()}</div><h2 style="font-size:24px;font-weight:900;letter-spacing:-0.03em;margin:0 0 20px;color:#000">${h2a}</h2>${p1}</div></section><section style="padding:48px 0;border-top:0.5px solid #EEE;background:#FAF8F3"><div style="max-width:1240px;margin:0 auto;padding:0 28px"><div style="font-size:11px;font-weight:700;letter-spacing:0.2em;color:#FF5500;margin-bottom:14px">${l2.toUpperCase()}</div><h2 style="font-size:24px;font-weight:900;letter-spacing:-0.03em;margin:0 0 20px;color:#000">${h2b}</h2>${p2}</div></section>`;
}
function __shouldBoost(p){if(p.startsWith('/robots')||p.startsWith('/sitemap')||p.startsWith('/favicon'))return false;return true;}

var src_default = app;
const __orig_default = src_default;
const __wrapped_default = {
  async fetch(request, env, ctx) {
    const __url = new URL(request.url);
    const __path = decodeURIComponent(__url.pathname);
    
    // 라우트 차단: /제품/, /업종/ 단독만 차단 (지역×제품 4-segment는 유지)
    if (__path.startsWith('/제품/') ||
        __path.startsWith('/업종/')) {
      return new Response('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>Not Found</title></head><body><h1>404</h1><p><a href="/">홈으로</a></p></body></html>', { 
        status: 404, 
        headers: {'Content-Type':'text/html; charset=utf-8'} 
      });
    }
    
    const response = await __orig_default.fetch(request, env, ctx);
    
    // 사이트맵에서도 차단된 URL 제거
    if (__path.startsWith('/sitemap') && (response.headers.get('content-type') || '').includes('xml')) {
      let __xml = await response.text();
      __xml = __xml.split('\n').filter(line => {
        if (line.includes('/%EC%A0%9C%ED%92%88/') || line.includes('/제품/')) return false;
        if (line.includes('/%EC%97%85%EC%A2%85/') || line.includes('/업종/')) return false;
        return true;
      }).join('\n');
      const newH = new Headers(response.headers);
      newH.delete('content-length');
      return new Response(__xml, { status: response.status, headers: newH });
    }
    try {
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('text/html')) return response;
      const url = new URL(request.url);
      if (!__shouldBoost(url.pathname)) return response;
      let html = await response.text();
      const boost = __generateBooster(url.pathname);
      // </main> 또는 footer 직전에 inject
      let injected = false;
      if (html.includes('</main>')) {
        html = html.replace('</main>', boost + '</main>');
        injected = true;
      } else {
        // footer 패턴 찾기
        const footerMatch = html.match(/<footer\b/i);
        if (footerMatch) {
          html = html.slice(0, footerMatch.index) + boost + html.slice(footerMatch.index);
          injected = true;
        } else if (html.includes('</body>')) {
          html = html.replace('</body>', boost + '</body>');
          injected = true;
        }
      }
      // ─── 추가 후처리: H1 교체, max-width, 썸네일 ───
      // 1. max-width 일괄 변경 (1280 → 1100)
      html = html.replace(/max-width:\s*1280px/g, 'max-width: 1100px');
      
      // 1b. /제품/* /업종/* 링크 통째로 제거 (메인페이지의 제품 카드, 업종 카드 등)
      // <a href="/제품/...">...</a> 또는 인코딩된 형태를 a 태그 째로 제거
      html = html.replace(/<a\b[^>]*href="(?:\/%EC%A0%9C%ED%92%88\/|\/제품\/)[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
      html = html.replace(/<a\b[^>]*href="(?:\/%EC%97%85%EC%A2%85\/|\/업종\/)[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
      
      // 5. 푸터·topbar 검정 통일 (--brown 변수 검정으로)
      html = html.replace(/--brown:\s*#3D2817/g, '--brown: #000000');
      html = html.replace(/--brown-deep:\s*#2A1B0F/g, '--brown-deep: #000000');
      
      // 6. 푸터 정리 (빈 li/ul/컬럼 제거, /#industries 링크 제거)
      html = html.replace(/<footer[\s\S]*?<\/footer>/, function(__fooHtml) {
        let __c = __fooHtml;
        // /#industries 링크가 있는 li 제거 (BY INDUSTRY 섹션 사라졌으니)
        __c = __c.replace(/<li>\s*<a[^>]+href="\/#industries"[^>]*>[\s\S]*?<\/a>\s*<\/li>/g, '');
        // 안이 다 빈 li인 ul 통째 제거
        __c = __c.replace(/<ul[^>]*>(?:\s*<li>\s*<\/li>\s*)+<\/ul>/g, '');
        // 남은 빈 li 제거
        __c = __c.replace(/<li>\s*<\/li>/g, '');
        // 빈 ul 제거
        __c = __c.replace(/<ul[^>]*>\s*<\/ul>/g, '');
        // footer-col-label만 있고 그 다음 형제가 ul이 아니거나 다음 label이 오는 경우 제거
        __c = __c.replace(/<div\s+class="footer-col-label"[^>]*>[^<]*<\/div>(?=\s*(?:<div\s+class="footer-col-label"|<\/div>))/g, '');
        // 빈 footer-col 통째 제거
        __c = __c.replace(/<div\s+class="footer-col">\s*<\/div>/g, '');
        return __c;
      });
      
      // 4. 메인페이지(/)에서 BY INDUSTRY (업종별 맞춤구성) 섹션 통째 제거
      if (url.pathname === '/' || url.pathname === '') {
        // sec-label "BY INDUSTRY"를 포함한 가장 가까운 <section>...</section> 제거
        html = html.replace(/<section\b[^>]*>(?:(?!<\/section>)[\s\S])*?BY INDUSTRY(?:(?!<\/section>)[\s\S])*?<\/section>/gi, '');
        // h2 "업종별 맞춤" 패턴도 제거 (만일을 위해)
        html = html.replace(/<section\b[^>]*>(?:(?!<\/section>)[\s\S])*?업종별 맞춤(?:(?!<\/section>)[\s\S])*?<\/section>/gi, '');
      }
      
      // 2. 광역/시군구/동 페이지의 H1 교체
      const __segs2 = url.pathname.split('/').map(s => s ? decodeURIComponent(s) : s).filter(Boolean);
      const __isProduct = url.pathname.startsWith('/%EC%A0%9C%ED%92%88') || decodeURIComponent(url.pathname).startsWith('/제품');
      const __isIndustry = url.pathname.startsWith('/%EC%97%85%EC%A2%85') || decodeURIComponent(url.pathname).startsWith('/업종');
      
      if (!__isProduct && !__isIndustry && __segs2.length >= 1 && __segs2.length <= 3) {
        let __newH1, __thumbLabel;
        if (__segs2.length === 1) {
          // 광역
          __newH1 = `${__segs2[0]} 매장에<br><span style="color:var(--orange)">카드단말기·포스기·CCTV</span><br>출장 설치.`;
          __thumbLabel = __segs2[0];
        } else if (__segs2.length === 2) {
          // 시군구
          __newH1 = `${__segs2[0]} ${__segs2[1]}<br><span style="color:var(--orange)">매장 설비</span><br>출장 설치 전문.`;
          __thumbLabel = `${__segs2[0]} ${__segs2[1]}`;
        } else {
          // 동
          __newH1 = `${__segs2[2]} 매장도<br><span style="color:var(--orange)">카드단말기·포스기·CCTV</span><br>출장 갑니다.`;
          __thumbLabel = `${__segs2[0]} ${__segs2[1]} ${__segs2[2]}`;
        }
        // 첫 번째 H1만 교체
        html = html.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/, `<h1$1 style="font-size:clamp(32px,4.4vw,56px);font-weight:900;letter-spacing:-0.04em;line-height:1.15;margin-bottom:20px;color:#000">${__newH1}</h1>`);
        
        // 3. 썸네일 inject: hero (page-header) 섹션 안에 추가
        const __seedSafe = encodeURIComponent(__segs2.join('-')).replace(/[%]/g, '');
        const __thumbHtml = `<div style="width:100%;max-width:1100px;margin:24px auto 0;border-radius:16px;overflow:hidden;background:#FAF8F3;aspect-ratio:21/9;position:relative"><img src="https://picsum.photos/seed/${__seedSafe}/1100/470" alt="${__thumbLabel}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block"><div style="position:absolute;left:18px;bottom:16px;background:rgba(0,0,0,0.7);color:#fff;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600">📍 ${__thumbLabel}</div></div>`;
        // page-header section 닫기 직전에 inject
        html = html.replace(/<\/section>/, __thumbHtml + '</section>');
      }
      
      if (!injected) {
        const newHeaders0 = new Headers(response.headers);
        newHeaders0.delete('content-length');
        return new Response(html, { status: response.status, headers: newHeaders0 });
      }
      const newHeaders = new Headers(response.headers);
      newHeaders.delete('content-length');
      return new Response(html, { status: response.status, headers: newHeaders });
    } catch (e) {
      return response;
    }
  }
};
export {
  __wrapped_default as default
};

