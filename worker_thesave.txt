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
  --orange: #FF6900;
  --orange-deep: #E55A00;
  --orange-tint: #FFF0E5;
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
  border-left: 4px solid #E55A00;
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
      /* @__PURE__ */ jsxDEV("meta", { name: "theme-color", content: "#FF6900" }),
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
        /* @__PURE__ */ jsxDEV("svg", { class: "logo-mark", width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "#FF6900", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", children: [
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
        /* @__PURE__ */ jsxDEV("li", { class: "has-mega", "data-mega-trigger": true, children: [
          /* @__PURE__ */ jsxDEV("button", { type: "button", class: "nav-link", "data-mega-btn": true, children: [
            "\uC81C\uD488",
            /* @__PURE__ */ jsxDEV("svg", { class: "nav-caret", width: "10", height: "10", viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ jsxDEV("path", { d: "M2 4l4 4 4-4", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }) })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mega-panel", "data-mega-panel": true, children: /* @__PURE__ */ jsxDEV("div", { class: "mega-inner", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "mega-col", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "mega-col-label", children: "\uC2E0\uADDC \uC7A5\uBE44" }),
              /* @__PURE__ */ jsxDEV("ul", { class: "mega-items", children: [
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uD3EC\uC2A4\uAE30", children: "\uD3EC\uC2A4\uAE30" }) }),
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uCE74\uB4DC\uB2E8\uB9D0\uAE30", children: "\uCE74\uB4DC\uB2E8\uB9D0\uAE30" }) }),
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uD0A4\uC624\uC2A4\uD06C", children: "\uD0A4\uC624\uC2A4\uD06C" }) }),
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uD14C\uC774\uBE14\uC624\uB354", children: "\uD14C\uC774\uBE14\uC624\uB354" }) }),
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/CCTV\uC124\uCE58", children: "CCTV" }) }),
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uC778\uD130\uB137\uC124\uCE58", children: "\uC778\uD130\uB137" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mega-col", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "mega-col-label", children: "\uAC74\uCD95" }),
              /* @__PURE__ */ jsxDEV("ul", { class: "mega-items", children: [
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uAC74\uCD95\uCCA0\uAC70", children: "\uCCA0\uAC70" }) }),
                /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uAC74\uCD95\uC778\uD14C\uB9AC\uC5B4", children: "\uC778\uD14C\uB9AC\uC5B4" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mega-col", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "mega-col-label", children: "\uAE30\uD0C0" }),
              /* @__PURE__ */ jsxDEV("ul", { class: "mega-items", children: /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/\uC81C\uD488/\uC790\uD310\uAE30", children: "\uC790\uD310\uAE30" }) }) })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/#industries", class: "nav-link", children: "\uC5C5\uC885" }) }),
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
        /* @__PURE__ */ jsxDEV("svg", { class: "logo-mark", width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "#FF6900", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", children: [
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
        /* @__PURE__ */ jsxDEV("div", { class: "device-header", style: "color:#FF6900; opacity:1;", children: "\uC8FC\uBB38 \uD604\uD669" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-title", children: "\uD0A4\uC624\uC2A4\uD06C" }),
        /* @__PURE__ */ jsxDEV("div", { class: "device-row", style: "font-size: 12px;", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "#241" }),
          /* @__PURE__ */ jsxDEV("span", { style: "color:#FF6900;", children: "\uC870\uB9AC\uC911" })
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
var seoulDistricts = [
  { slug: "\uAC15\uB0A8\uAD6C", name: "\uAC15\uB0A8\uAD6C", nameEn: "Gangnam", dongs: [
    { slug: "\uC5ED\uC0BC\uB3D9", name: "\uC5ED\uC0BC\uB3D9" },
    { slug: "\uC0BC\uC131\uB3D9", name: "\uC0BC\uC131\uB3D9" },
    { slug: "\uB17C\uD604\uB3D9", name: "\uB17C\uD604\uB3D9" },
    { slug: "\uCCAD\uB2F4\uB3D9", name: "\uCCAD\uB2F4\uB3D9" },
    { slug: "\uC555\uAD6C\uC815\uB3D9", name: "\uC555\uAD6C\uC815\uB3D9" }
  ] },
  { slug: "\uAC15\uB3D9\uAD6C", name: "\uAC15\uB3D9\uAD6C", nameEn: "Gangdong", dongs: [
    { slug: "\uCC9C\uD638\uB3D9", name: "\uCC9C\uD638\uB3D9" },
    { slug: "\uC554\uC0AC\uB3D9", name: "\uC554\uC0AC\uB3D9" },
    { slug: "\uBA85\uC77C\uB3D9", name: "\uBA85\uC77C\uB3D9" }
  ] },
  { slug: "\uAC15\uBD81\uAD6C", name: "\uAC15\uBD81\uAD6C", nameEn: "Gangbuk", dongs: [
    { slug: "\uBBF8\uC544\uB3D9", name: "\uBBF8\uC544\uB3D9" },
    { slug: "\uC218\uC720\uB3D9", name: "\uC218\uC720\uB3D9" }
  ] },
  { slug: "\uAC15\uC11C\uAD6C", name: "\uAC15\uC11C\uAD6C", nameEn: "Gangseo", dongs: [
    { slug: "\uD654\uACE1\uB3D9", name: "\uD654\uACE1\uB3D9" },
    { slug: "\uBC1C\uC0B0\uB3D9", name: "\uBC1C\uC0B0\uB3D9" },
    { slug: "\uB9C8\uACE1\uB3D9", name: "\uB9C8\uACE1\uB3D9" }
  ] },
  { slug: "\uAD00\uC545\uAD6C", name: "\uAD00\uC545\uAD6C", nameEn: "Gwanak", dongs: [
    { slug: "\uC2E0\uB9BC\uB3D9", name: "\uC2E0\uB9BC\uB3D9" },
    { slug: "\uBD09\uCC9C\uB3D9", name: "\uBD09\uCC9C\uB3D9" }
  ] },
  { slug: "\uAD11\uC9C4\uAD6C", name: "\uAD11\uC9C4\uAD6C", nameEn: "Gwangjin", dongs: [
    { slug: "\uAD6C\uC758\uB3D9", name: "\uAD6C\uC758\uB3D9" },
    { slug: "\uC790\uC591\uB3D9", name: "\uC790\uC591\uB3D9" }
  ] },
  { slug: "\uAD6C\uB85C\uAD6C", name: "\uAD6C\uB85C\uAD6C", nameEn: "Guro", dongs: [
    { slug: "\uAD6C\uB85C\uB3D9", name: "\uAD6C\uB85C\uB3D9" },
    { slug: "\uC2E0\uB3C4\uB9BC\uB3D9", name: "\uC2E0\uB3C4\uB9BC\uB3D9" }
  ] },
  { slug: "\uAE08\uCC9C\uAD6C", name: "\uAE08\uCC9C\uAD6C", nameEn: "Geumcheon", dongs: [
    { slug: "\uAC00\uC0B0\uB3D9", name: "\uAC00\uC0B0\uB3D9" },
    { slug: "\uB3C5\uC0B0\uB3D9", name: "\uB3C5\uC0B0\uB3D9" }
  ] },
  { slug: "\uB178\uC6D0\uAD6C", name: "\uB178\uC6D0\uAD6C", nameEn: "Nowon", dongs: [
    { slug: "\uC0C1\uACC4\uB3D9", name: "\uC0C1\uACC4\uB3D9" },
    { slug: "\uC911\uACC4\uB3D9", name: "\uC911\uACC4\uB3D9" }
  ] },
  { slug: "\uB3C4\uBD09\uAD6C", name: "\uB3C4\uBD09\uAD6C", nameEn: "Dobong", dongs: [
    { slug: "\uC30D\uBB38\uB3D9", name: "\uC30D\uBB38\uB3D9" },
    { slug: "\uBC29\uD559\uB3D9", name: "\uBC29\uD559\uB3D9" }
  ] },
  { slug: "\uB3D9\uB300\uBB38\uAD6C", name: "\uB3D9\uB300\uBB38\uAD6C", nameEn: "Dongdaemun", dongs: [
    { slug: "\uCCAD\uB7C9\uB9AC\uB3D9", name: "\uCCAD\uB7C9\uB9AC\uB3D9" },
    { slug: "\uC804\uB18D\uB3D9", name: "\uC804\uB18D\uB3D9" }
  ] },
  { slug: "\uB3D9\uC791\uAD6C", name: "\uB3D9\uC791\uAD6C", nameEn: "Dongjak", dongs: [
    { slug: "\uC0AC\uB2F9\uB3D9", name: "\uC0AC\uB2F9\uB3D9" },
    { slug: "\uC0C1\uB3C4\uB3D9", name: "\uC0C1\uB3C4\uB3D9" },
    { slug: "\uD751\uC11D\uB3D9", name: "\uD751\uC11D\uB3D9" }
  ] },
  { slug: "\uB9C8\uD3EC\uAD6C", name: "\uB9C8\uD3EC\uAD6C", nameEn: "Mapo", dongs: [
    { slug: "\uC0C1\uC554\uB3D9", name: "\uC0C1\uC554\uB3D9" },
    { slug: "\uD569\uC815\uB3D9", name: "\uD569\uC815\uB3D9" },
    { slug: "\uB9DD\uC6D0\uB3D9", name: "\uB9DD\uC6D0\uB3D9" },
    { slug: "\uC5F0\uB0A8\uB3D9", name: "\uC5F0\uB0A8\uB3D9" }
  ] },
  { slug: "\uC11C\uB300\uBB38\uAD6C", name: "\uC11C\uB300\uBB38\uAD6C", nameEn: "Seodaemun", dongs: [
    { slug: "\uC5F0\uD76C\uB3D9", name: "\uC5F0\uD76C\uB3D9" },
    { slug: "\uD64D\uC81C\uB3D9", name: "\uD64D\uC81C\uB3D9" }
  ] },
  { slug: "\uC11C\uCD08\uAD6C", name: "\uC11C\uCD08\uAD6C", nameEn: "Seocho", dongs: [
    { slug: "\uC11C\uCD08\uB3D9", name: "\uC11C\uCD08\uB3D9" },
    { slug: "\uBC18\uD3EC\uB3D9", name: "\uBC18\uD3EC\uB3D9" },
    { slug: "\uC7A0\uC6D0\uB3D9", name: "\uC7A0\uC6D0\uB3D9" }
  ] },
  { slug: "\uC131\uB3D9\uAD6C", name: "\uC131\uB3D9\uAD6C", nameEn: "Seongdong", dongs: [
    { slug: "\uC131\uC218\uB3D9", name: "\uC131\uC218\uB3D9" },
    { slug: "\uC655\uC2ED\uB9AC\uB3D9", name: "\uC655\uC2ED\uB9AC\uB3D9" }
  ] },
  { slug: "\uC131\uBD81\uAD6C", name: "\uC131\uBD81\uAD6C", nameEn: "Seongbuk", dongs: [
    { slug: "\uC131\uBD81\uB3D9", name: "\uC131\uBD81\uB3D9" },
    { slug: "\uC815\uB989\uB3D9", name: "\uC815\uB989\uB3D9" }
  ] },
  { slug: "\uC1A1\uD30C\uAD6C", name: "\uC1A1\uD30C\uAD6C", nameEn: "Songpa", dongs: [
    { slug: "\uC7A0\uC2E4\uB3D9", name: "\uC7A0\uC2E4\uB3D9" },
    { slug: "\uBB38\uC815\uB3D9", name: "\uBB38\uC815\uB3D9" },
    { slug: "\uBC29\uC774\uB3D9", name: "\uBC29\uC774\uB3D9" }
  ] },
  { slug: "\uC591\uCC9C\uAD6C", name: "\uC591\uCC9C\uAD6C", nameEn: "Yangcheon", dongs: [
    { slug: "\uBAA9\uB3D9", name: "\uBAA9\uB3D9" },
    { slug: "\uC2E0\uC815\uB3D9", name: "\uC2E0\uC815\uB3D9" }
  ] },
  { slug: "\uC601\uB4F1\uD3EC\uAD6C", name: "\uC601\uB4F1\uD3EC\uAD6C", nameEn: "Yeongdeungpo", dongs: [
    { slug: "\uC5EC\uC758\uB3C4\uB3D9", name: "\uC5EC\uC758\uB3C4\uB3D9" },
    { slug: "\uC601\uB4F1\uD3EC\uB3D9", name: "\uC601\uB4F1\uD3EC\uB3D9" },
    { slug: "\uB2F9\uC0B0\uB3D9", name: "\uB2F9\uC0B0\uB3D9" }
  ] },
  { slug: "\uC6A9\uC0B0\uAD6C", name: "\uC6A9\uC0B0\uAD6C", nameEn: "Yongsan", dongs: [
    { slug: "\uC774\uD0DC\uC6D0\uB3D9", name: "\uC774\uD0DC\uC6D0\uB3D9" },
    { slug: "\uD55C\uB0A8\uB3D9", name: "\uD55C\uB0A8\uB3D9" },
    { slug: "\uC6A9\uC0B0\uB3D9", name: "\uC6A9\uC0B0\uB3D9" }
  ] },
  { slug: "\uC740\uD3C9\uAD6C", name: "\uC740\uD3C9\uAD6C", nameEn: "Eunpyeong", dongs: [
    { slug: "\uBD88\uAD11\uB3D9", name: "\uBD88\uAD11\uB3D9" },
    { slug: "\uC751\uC554\uB3D9", name: "\uC751\uC554\uB3D9" }
  ] },
  { slug: "\uC885\uB85C\uAD6C", name: "\uC885\uB85C\uAD6C", nameEn: "Jongno", dongs: [
    { slug: "\uC885\uB85C\uB3D9", name: "\uC885\uB85C\uB3D9" },
    { slug: "\uD61C\uD654\uB3D9", name: "\uD61C\uD654\uB3D9" },
    { slug: "\uC0AC\uC9C1\uB3D9", name: "\uC0AC\uC9C1\uB3D9" }
  ] },
  { slug: "\uC911\uAD6C", name: "\uC911\uAD6C", nameEn: "Jung", dongs: [
    { slug: "\uBA85\uB3D9", name: "\uBA85\uB3D9" },
    { slug: "\uC744\uC9C0\uB85C\uB3D9", name: "\uC744\uC9C0\uB85C\uB3D9" },
    { slug: "\uD68C\uD604\uB3D9", name: "\uD68C\uD604\uB3D9" }
  ] },
  { slug: "\uC911\uB791\uAD6C", name: "\uC911\uB791\uAD6C", nameEn: "Jungnang", dongs: [
    { slug: "\uBA74\uBAA9\uB3D9", name: "\uBA74\uBAA9\uB3D9" },
    { slug: "\uC0C1\uBD09\uB3D9", name: "\uC0C1\uBD09\uB3D9" }
  ] }
];
var gyeonggiDistricts = [
  { slug: "\uC218\uC6D0\uC2DC", name: "\uC218\uC6D0\uC2DC", nameEn: "Suwon", dongs: [
    { slug: "\uC601\uD1B5\uB3D9", name: "\uC601\uD1B5\uB3D9" },
    { slug: "\uAD11\uAD50\uB3D9", name: "\uAD11\uAD50\uB3D9" },
    { slug: "\uC778\uACC4\uB3D9", name: "\uC778\uACC4\uB3D9" }
  ] },
  { slug: "\uC131\uB0A8\uC2DC", name: "\uC131\uB0A8\uC2DC", nameEn: "Seongnam", dongs: [
    { slug: "\uBD84\uB2F9\uB3D9", name: "\uBD84\uB2F9\uB3D9" },
    { slug: "\uC815\uC790\uB3D9", name: "\uC815\uC790\uB3D9" },
    { slug: "\uD310\uAD50\uB3D9", name: "\uD310\uAD50\uB3D9" }
  ] },
  { slug: "\uC6A9\uC778\uC2DC", name: "\uC6A9\uC778\uC2DC", nameEn: "Yongin", dongs: [
    { slug: "\uAE30\uD765\uB3D9", name: "\uAE30\uD765\uB3D9" },
    { slug: "\uC218\uC9C0\uB3D9", name: "\uC218\uC9C0\uB3D9" }
  ] },
  { slug: "\uACE0\uC591\uC2DC", name: "\uACE0\uC591\uC2DC", nameEn: "Goyang", dongs: [
    { slug: "\uC77C\uC0B0\uB3D9", name: "\uC77C\uC0B0\uB3D9" },
    { slug: "\uD654\uC815\uB3D9", name: "\uD654\uC815\uB3D9" }
  ] },
  { slug: "\uD654\uC131\uC2DC", name: "\uD654\uC131\uC2DC", nameEn: "Hwaseong", dongs: [
    { slug: "\uB3D9\uD0C4\uB3D9", name: "\uB3D9\uD0C4\uB3D9" },
    { slug: "\uBD09\uB2F4\uC74D", name: "\uBD09\uB2F4\uC74D" }
  ] },
  { slug: "\uBD80\uCC9C\uC2DC", name: "\uBD80\uCC9C\uC2DC", nameEn: "Bucheon", dongs: [
    { slug: "\uC911\uB3D9", name: "\uC911\uB3D9" },
    { slug: "\uC0C1\uB3D9", name: "\uC0C1\uB3D9" }
  ] },
  { slug: "\uB0A8\uC591\uC8FC\uC2DC", name: "\uB0A8\uC591\uC8FC\uC2DC", nameEn: "Namyangju", dongs: [
    { slug: "\uB2E4\uC0B0\uB3D9", name: "\uB2E4\uC0B0\uB3D9" },
    { slug: "\uD638\uD3C9\uB3D9", name: "\uD638\uD3C9\uB3D9" }
  ] },
  { slug: "\uC548\uC0B0\uC2DC", name: "\uC548\uC0B0\uC2DC", nameEn: "Ansan", dongs: [
    { slug: "\uACE0\uC794\uB3D9", name: "\uACE0\uC794\uB3D9" },
    { slug: "\uC120\uBD80\uB3D9", name: "\uC120\uBD80\uB3D9" }
  ] },
  { slug: "\uD3C9\uD0DD\uC2DC", name: "\uD3C9\uD0DD\uC2DC", nameEn: "Pyeongtaek", dongs: [
    { slug: "\uBE44\uC804\uB3D9", name: "\uBE44\uC804\uB3D9" },
    { slug: "\uACE0\uB355\uBA74", name: "\uACE0\uB355\uBA74" }
  ] },
  { slug: "\uC548\uC591\uC2DC", name: "\uC548\uC591\uC2DC", nameEn: "Anyang", dongs: [
    { slug: "\uD3C9\uCD0C\uB3D9", name: "\uD3C9\uCD0C\uB3D9" },
    { slug: "\uC778\uB355\uC6D0\uB3D9", name: "\uC778\uB355\uC6D0\uB3D9" }
  ] },
  { slug: "\uC2DC\uD765\uC2DC", name: "\uC2DC\uD765\uC2DC", nameEn: "Siheung", dongs: [
    { slug: "\uC815\uC655\uB3D9", name: "\uC815\uC655\uB3D9" },
    { slug: "\uBC30\uACE7\uB3D9", name: "\uBC30\uACE7\uB3D9" }
  ] },
  { slug: "\uAE40\uD3EC\uC2DC", name: "\uAE40\uD3EC\uC2DC", nameEn: "Gimpo", dongs: [
    { slug: "\uC7A5\uAE30\uB3D9", name: "\uC7A5\uAE30\uB3D9" },
    { slug: "\uAD6C\uB798\uB3D9", name: "\uAD6C\uB798\uB3D9" }
  ] },
  { slug: "\uAD11\uC8FC\uC2DC", name: "\uAD11\uC8FC\uC2DC", nameEn: "Gwangju", dongs: [
    { slug: "\uC624\uD3EC\uC74D", name: "\uC624\uD3EC\uC74D" }
  ] },
  { slug: "\uAD11\uBA85\uC2DC", name: "\uAD11\uBA85\uC2DC", nameEn: "Gwangmyeong", dongs: [
    { slug: "\uCCA0\uC0B0\uB3D9", name: "\uCCA0\uC0B0\uB3D9" },
    { slug: "\uD558\uC548\uB3D9", name: "\uD558\uC548\uB3D9" }
  ] },
  { slug: "\uAD70\uD3EC\uC2DC", name: "\uAD70\uD3EC\uC2DC", nameEn: "Gunpo", dongs: [
    { slug: "\uC0B0\uBCF8\uB3D9", name: "\uC0B0\uBCF8\uB3D9" }
  ] },
  { slug: "\uD558\uB0A8\uC2DC", name: "\uD558\uB0A8\uC2DC", nameEn: "Hanam", dongs: [
    { slug: "\uB9DD\uC6D4\uB3D9", name: "\uB9DD\uC6D4\uB3D9" },
    { slug: "\uBBF8\uC0AC\uB3D9", name: "\uBBF8\uC0AC\uB3D9" }
  ] },
  { slug: "\uC624\uC0B0\uC2DC", name: "\uC624\uC0B0\uC2DC", nameEn: "Osan", dongs: [
    { slug: "\uC138\uB9C8\uB3D9", name: "\uC138\uB9C8\uB3D9" }
  ] },
  { slug: "\uC774\uCC9C\uC2DC", name: "\uC774\uCC9C\uC2DC", nameEn: "Icheon", dongs: [
    { slug: "\uBD80\uBC1C\uC74D", name: "\uBD80\uBC1C\uC74D" }
  ] },
  { slug: "\uC591\uC8FC\uC2DC", name: "\uC591\uC8FC\uC2DC", nameEn: "Yangju", dongs: [
    { slug: "\uC625\uC815\uB3D9", name: "\uC625\uC815\uB3D9" }
  ] },
  { slug: "\uAD6C\uB9AC\uC2DC", name: "\uAD6C\uB9AC\uC2DC", nameEn: "Guri", dongs: [
    { slug: "\uC778\uCC3D\uB3D9", name: "\uC778\uCC3D\uB3D9" }
  ] },
  { slug: "\uC548\uC131\uC2DC", name: "\uC548\uC131\uC2DC", nameEn: "Anseong", dongs: [
    { slug: "\uACF5\uB3C4\uC74D", name: "\uACF5\uB3C4\uC74D" }
  ] },
  { slug: "\uD3EC\uCC9C\uC2DC", name: "\uD3EC\uCC9C\uC2DC", nameEn: "Pocheon", dongs: [
    { slug: "\uC18C\uD758\uC74D", name: "\uC18C\uD758\uC74D" }
  ] },
  { slug: "\uC758\uC655\uC2DC", name: "\uC758\uC655\uC2DC", nameEn: "Uiwang", dongs: [
    { slug: "\uB0B4\uC190\uB3D9", name: "\uB0B4\uC190\uB3D9" }
  ] },
  { slug: "\uC591\uD3C9\uAD70", name: "\uC591\uD3C9\uAD70", nameEn: "Yangpyeong", dongs: [
    { slug: "\uC591\uD3C9\uC74D", name: "\uC591\uD3C9\uC74D" }
  ] },
  { slug: "\uC5EC\uC8FC\uC2DC", name: "\uC5EC\uC8FC\uC2DC", nameEn: "Yeoju", dongs: [
    { slug: "\uC5EC\uC8FC\uB3D9", name: "\uC5EC\uC8FC\uB3D9" }
  ] },
  { slug: "\uB3D9\uB450\uCC9C\uC2DC", name: "\uB3D9\uB450\uCC9C\uC2DC", nameEn: "Dongducheon", dongs: [
    { slug: "\uC0DD\uC5F0\uB3D9", name: "\uC0DD\uC5F0\uB3D9" }
  ] },
  { slug: "\uACFC\uCC9C\uC2DC", name: "\uACFC\uCC9C\uC2DC", nameEn: "Gwacheon", dongs: [
    { slug: "\uC6D0\uBB38\uB3D9", name: "\uC6D0\uBB38\uB3D9" }
  ] },
  { slug: "\uAC00\uD3C9\uAD70", name: "\uAC00\uD3C9\uAD70", nameEn: "Gapyeong", dongs: [
    { slug: "\uAC00\uD3C9\uC74D", name: "\uAC00\uD3C9\uC74D" }
  ] },
  { slug: "\uC5F0\uCC9C\uAD70", name: "\uC5F0\uCC9C\uAD70", nameEn: "Yeoncheon", dongs: [
    { slug: "\uC5F0\uCC9C\uC74D", name: "\uC5F0\uCC9C\uC74D" }
  ] },
  { slug: "\uD30C\uC8FC\uC2DC", name: "\uD30C\uC8FC\uC2DC", nameEn: "Paju", dongs: [
    { slug: "\uC6B4\uC815\uB3D9", name: "\uC6B4\uC815\uB3D9" },
    { slug: "\uAE08\uCD0C\uB3D9", name: "\uAE08\uCD0C\uB3D9" }
  ] },
  { slug: "\uC758\uC815\uBD80\uC2DC", name: "\uC758\uC815\uBD80\uC2DC", nameEn: "Uijeongbu", dongs: [
    { slug: "\uBBFC\uB77D\uB3D9", name: "\uBBFC\uB77D\uB3D9" },
    { slug: "\uD638\uC6D0\uB3D9", name: "\uD638\uC6D0\uB3D9" }
  ] }
];
var incheonDistricts = [
  { slug: "\uC5F0\uC218\uAD6C", name: "\uC5F0\uC218\uAD6C", nameEn: "Yeonsu", dongs: [
    { slug: "\uC1A1\uB3C4\uB3D9", name: "\uC1A1\uB3C4\uB3D9" },
    { slug: "\uC5F0\uC218\uB3D9", name: "\uC5F0\uC218\uB3D9" }
  ] },
  { slug: "\uB0A8\uB3D9\uAD6C", name: "\uB0A8\uB3D9\uAD6C", nameEn: "Namdong", dongs: [
    { slug: "\uAD6C\uC6D4\uB3D9", name: "\uAD6C\uC6D4\uB3D9" },
    { slug: "\uB17C\uD604\uB3D9", name: "\uB17C\uD604\uB3D9" }
  ] },
  { slug: "\uBD80\uD3C9\uAD6C", name: "\uBD80\uD3C9\uAD6C", nameEn: "Bupyeong", dongs: [
    { slug: "\uBD80\uD3C9\uB3D9", name: "\uBD80\uD3C9\uB3D9" },
    { slug: "\uC0BC\uC0B0\uB3D9", name: "\uC0BC\uC0B0\uB3D9" }
  ] },
  { slug: "\uC911\uAD6C", name: "\uC911\uAD6C", nameEn: "Jung", dongs: [
    { slug: "\uC6B4\uC11C\uB3D9", name: "\uC6B4\uC11C\uB3D9" },
    { slug: "\uC2E0\uD3EC\uB3D9", name: "\uC2E0\uD3EC\uB3D9" }
  ] },
  { slug: "\uC11C\uAD6C", name: "\uC11C\uAD6C", nameEn: "Seo", dongs: [
    { slug: "\uCCAD\uB77C\uB3D9", name: "\uCCAD\uB77C\uB3D9" },
    { slug: "\uAC80\uB2E8\uB3D9", name: "\uAC80\uB2E8\uB3D9" }
  ] },
  { slug: "\uB3D9\uAD6C", name: "\uB3D9\uAD6C", nameEn: "Dong", dongs: [
    { slug: "\uC1A1\uD604\uB3D9", name: "\uC1A1\uD604\uB3D9" }
  ] },
  { slug: "\uBBF8\uCD94\uD640\uAD6C", name: "\uBBF8\uCD94\uD640\uAD6C", nameEn: "Michuhol", dongs: [
    { slug: "\uC8FC\uC548\uB3D9", name: "\uC8FC\uC548\uB3D9" },
    { slug: "\uC6A9\uD604\uB3D9", name: "\uC6A9\uD604\uB3D9" }
  ] },
  { slug: "\uACC4\uC591\uAD6C", name: "\uACC4\uC591\uAD6C", nameEn: "Gyeyang", dongs: [
    { slug: "\uC791\uC804\uB3D9", name: "\uC791\uC804\uB3D9" },
    { slug: "\uACC4\uC0B0\uB3D9", name: "\uACC4\uC0B0\uB3D9" }
  ] },
  { slug: "\uAC15\uD654\uAD70", name: "\uAC15\uD654\uAD70", nameEn: "Ganghwa", dongs: [
    { slug: "\uAC15\uD654\uC74D", name: "\uAC15\uD654\uC74D" }
  ] },
  { slug: "\uC639\uC9C4\uAD70", name: "\uC639\uC9C4\uAD70", nameEn: "Ongjin", dongs: [
    { slug: "\uBD81\uB3C4\uBA74", name: "\uBD81\uB3C4\uBA74" }
  ] }
];
var regions = [
  {
    code: "seoul",
    nameKo: "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC",
    nameKoShort: "\uC11C\uC6B8",
    nameEn: "Seoul",
    districts: seoulDistricts,
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
    districts: gyeonggiDistricts,
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
    districts: incheonDistricts,
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
      { slug: "\uD574\uC6B4\uB300\uAD6C", name: "\uD574\uC6B4\uB300\uAD6C", nameEn: "Haeundae", dongs: [
        { slug: "\uC6B0\uB3D9", name: "\uC6B0\uB3D9" },
        { slug: "\uC911\uB3D9", name: "\uC911\uB3D9" },
        { slug: "\uC88C\uB3D9", name: "\uC88C\uB3D9" }
      ] },
      { slug: "\uBD80\uC0B0\uC9C4\uAD6C", name: "\uBD80\uC0B0\uC9C4\uAD6C", nameEn: "Busanjin", dongs: [
        { slug: "\uBD80\uC804\uB3D9", name: "\uBD80\uC804\uB3D9" },
        { slug: "\uC11C\uBA74", name: "\uC11C\uBA74" }
      ] },
      { slug: "\uC911\uAD6C", name: "\uC911\uAD6C", nameEn: "Jung", dongs: [
        { slug: "\uB0A8\uD3EC\uB3D9", name: "\uB0A8\uD3EC\uB3D9" },
        { slug: "\uAD11\uBCF5\uB3D9", name: "\uAD11\uBCF5\uB3D9" }
      ] },
      { slug: "\uB0A8\uAD6C", name: "\uB0A8\uAD6C", nameEn: "Nam", dongs: [
        { slug: "\uB300\uC5F0\uB3D9", name: "\uB300\uC5F0\uB3D9" },
        { slug: "\uC6A9\uD638\uB3D9", name: "\uC6A9\uD638\uB3D9" }
      ] },
      { slug: "\uC218\uC601\uAD6C", name: "\uC218\uC601\uAD6C", nameEn: "Suyeong", dongs: [
        { slug: "\uAD11\uC548\uB3D9", name: "\uAD11\uC548\uB3D9" },
        { slug: "\uB0A8\uCC9C\uB3D9", name: "\uB0A8\uCC9C\uB3D9" }
      ] },
      { slug: "\uB3D9\uB798\uAD6C", name: "\uB3D9\uB798\uAD6C", nameEn: "Dongnae", dongs: [
        { slug: "\uC628\uCC9C\uB3D9", name: "\uC628\uCC9C\uB3D9" },
        { slug: "\uC0AC\uC9C1\uB3D9", name: "\uC0AC\uC9C1\uB3D9" }
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
      { slug: "\uC911\uAD6C", name: "\uC911\uAD6C", nameEn: "Jung", dongs: [
        { slug: "\uB3D9\uC131\uB85C", name: "\uB3D9\uC131\uB85C" },
        { slug: "\uC0BC\uB355\uB3D9", name: "\uC0BC\uB355\uB3D9" }
      ] },
      { slug: "\uC218\uC131\uAD6C", name: "\uC218\uC131\uAD6C", nameEn: "Suseong", dongs: [
        { slug: "\uBC94\uC5B4\uB3D9", name: "\uBC94\uC5B4\uB3D9" },
        { slug: "\uB9CC\uCD0C\uB3D9", name: "\uB9CC\uCD0C\uB3D9" }
      ] },
      { slug: "\uB2EC\uC11C\uAD6C", name: "\uB2EC\uC11C\uAD6C", nameEn: "Dalseo", dongs: [
        { slug: "\uC0C1\uC778\uB3D9", name: "\uC0C1\uC778\uB3D9" },
        { slug: "\uC6D4\uC131\uB3D9", name: "\uC6D4\uC131\uB3D9" }
      ] },
      { slug: "\uBD81\uAD6C", name: "\uBD81\uAD6C", nameEn: "Buk", dongs: [
        { slug: "\uCE60\uACE1\uB3D9", name: "\uCE60\uACE1\uB3D9" },
        { slug: "\uC0B0\uACA9\uB3D9", name: "\uC0B0\uACA9\uB3D9" }
      ] },
      { slug: "\uB3D9\uAD6C", name: "\uB3D9\uAD6C", nameEn: "Dong", dongs: [
        { slug: "\uC2E0\uCC9C\uB3D9", name: "\uC2E0\uCC9C\uB3D9" },
        { slug: "\uD6A8\uBAA9\uB3D9", name: "\uD6A8\uBAA9\uB3D9" }
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
      { slug: "\uB3D9\uAD6C", name: "\uB3D9\uAD6C", nameEn: "Dong", dongs: [
        { slug: "\uCDA9\uC7A5\uB3D9", name: "\uCDA9\uC7A5\uB3D9" },
        { slug: "\uB3D9\uBA85\uB3D9", name: "\uB3D9\uBA85\uB3D9" }
      ] },
      { slug: "\uC11C\uAD6C", name: "\uC11C\uAD6C", nameEn: "Seo", dongs: [
        { slug: "\uAE08\uD638\uB3D9", name: "\uAE08\uD638\uB3D9" },
        { slug: "\uC0C1\uBB34\uB3D9", name: "\uC0C1\uBB34\uB3D9" }
      ] },
      { slug: "\uB0A8\uAD6C", name: "\uB0A8\uAD6C", nameEn: "Nam", dongs: [
        { slug: "\uBD09\uC120\uB3D9", name: "\uBD09\uC120\uB3D9" },
        { slug: "\uC8FC\uC6D4\uB3D9", name: "\uC8FC\uC6D4\uB3D9" }
      ] },
      { slug: "\uBD81\uAD6C", name: "\uBD81\uAD6C", nameEn: "Buk", dongs: [
        { slug: "\uC6A9\uBD09\uB3D9", name: "\uC6A9\uBD09\uB3D9" },
        { slug: "\uCCA8\uB2E8\uB3D9", name: "\uCCA8\uB2E8\uB3D9" }
      ] },
      { slug: "\uAD11\uC0B0\uAD6C", name: "\uAD11\uC0B0\uAD6C", nameEn: "Gwangsan", dongs: [
        { slug: "\uC218\uC644\uB3D9", name: "\uC218\uC644\uB3D9" },
        { slug: "\uC6B4\uB0A8\uB3D9", name: "\uC6B4\uB0A8\uB3D9" }
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
      { slug: "\uC720\uC131\uAD6C", name: "\uC720\uC131\uAD6C", nameEn: "Yuseong", dongs: [
        { slug: "\uBD09\uBA85\uB3D9", name: "\uBD09\uBA85\uB3D9" },
        { slug: "\uB178\uC740\uB3D9", name: "\uB178\uC740\uB3D9" }
      ] },
      { slug: "\uC11C\uAD6C", name: "\uC11C\uAD6C", nameEn: "Seo", dongs: [
        { slug: "\uB454\uC0B0\uB3D9", name: "\uB454\uC0B0\uB3D9" },
        { slug: "\uC6D4\uD3C9\uB3D9", name: "\uC6D4\uD3C9\uB3D9" }
      ] },
      { slug: "\uC911\uAD6C", name: "\uC911\uAD6C", nameEn: "Jung", dongs: [
        { slug: "\uC740\uD589\uB3D9", name: "\uC740\uD589\uB3D9" },
        { slug: "\uB300\uD765\uB3D9", name: "\uB300\uD765\uB3D9" }
      ] },
      { slug: "\uB3D9\uAD6C", name: "\uB3D9\uAD6C", nameEn: "Dong", dongs: [
        { slug: "\uC6A9\uC6B4\uB3D9", name: "\uC6A9\uC6B4\uB3D9" },
        { slug: "\uC2E0\uD765\uB3D9", name: "\uC2E0\uD765\uB3D9" }
      ] },
      { slug: "\uB300\uB355\uAD6C", name: "\uB300\uB355\uAD6C", nameEn: "Daedeok", dongs: [
        { slug: "\uC624\uC815\uB3D9", name: "\uC624\uC815\uB3D9" },
        { slug: "\uC1A1\uCD0C\uB3D9", name: "\uC1A1\uCD0C\uB3D9" }
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
      { slug: "\uB0A8\uAD6C", name: "\uB0A8\uAD6C", nameEn: "Nam", dongs: [
        { slug: "\uC0BC\uC0B0\uB3D9", name: "\uC0BC\uC0B0\uB3D9" },
        { slug: "\uB2EC\uB3D9", name: "\uB2EC\uB3D9" }
      ] },
      { slug: "\uC911\uAD6C", name: "\uC911\uAD6C", nameEn: "Jung", dongs: [
        { slug: "\uC131\uB0A8\uB3D9", name: "\uC131\uB0A8\uB3D9" },
        { slug: "\uBCF5\uC0B0\uB3D9", name: "\uBCF5\uC0B0\uB3D9" }
      ] },
      { slug: "\uB3D9\uAD6C", name: "\uB3D9\uAD6C", nameEn: "Dong", dongs: [
        { slug: "\uBC29\uC5B4\uB3D9", name: "\uBC29\uC5B4\uB3D9" },
        { slug: "\uC77C\uC0B0\uB3D9", name: "\uC77C\uC0B0\uB3D9" }
      ] },
      { slug: "\uBD81\uAD6C", name: "\uBD81\uAD6C", nameEn: "Buk", dongs: [
        { slug: "\uB18D\uC18C\uB3D9", name: "\uB18D\uC18C\uB3D9" },
        { slug: "\uC1A1\uC815\uB3D9", name: "\uC1A1\uC815\uB3D9" }
      ] },
      { slug: "\uC6B8\uC8FC\uAD70", name: "\uC6B8\uC8FC\uAD70", nameEn: "Ulju", dongs: [
        { slug: "\uBC94\uC11C\uC74D", name: "\uBC94\uC11C\uC74D" },
        { slug: "\uC5B8\uC591\uC74D", name: "\uC5B8\uC591\uC74D" }
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
      { slug: "\uD55C\uC194\uB3D9", name: "\uD55C\uC194\uB3D9", nameEn: "Hansol", dongs: [
        { slug: "\uD55C\uC194\uB3D9", name: "\uD55C\uC194\uB3D9" }
      ] },
      { slug: "\uB3C4\uB2F4\uB3D9", name: "\uB3C4\uB2F4\uB3D9", nameEn: "Dodam", dongs: [
        { slug: "\uB3C4\uB2F4\uB3D9", name: "\uB3C4\uB2F4\uB3D9" }
      ] },
      { slug: "\uC544\uB984\uB3D9", name: "\uC544\uB984\uB3D9", nameEn: "Areum", dongs: [
        { slug: "\uC544\uB984\uB3D9", name: "\uC544\uB984\uB3D9" }
      ] },
      { slug: "\uC885\uCD0C\uB3D9", name: "\uC885\uCD0C\uB3D9", nameEn: "Jongchon", dongs: [
        { slug: "\uC885\uCD0C\uB3D9", name: "\uC885\uCD0C\uB3D9" }
      ] },
      { slug: "\uC0C8\uB86C\uB3D9", name: "\uC0C8\uB86C\uB3D9", nameEn: "Saerom", dongs: [
        { slug: "\uC0C8\uB86C\uB3D9", name: "\uC0C8\uB86C\uB3D9" }
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
      { slug: "\uC81C\uC8FC\uC2DC", name: "\uC81C\uC8FC\uC2DC", nameEn: "Jeju-si", dongs: [
        { slug: "\uC5F0\uB3D9", name: "\uC5F0\uB3D9" },
        { slug: "\uB178\uD615\uB3D9", name: "\uB178\uD615\uB3D9" },
        { slug: "\uC774\uB3C4\uB3D9", name: "\uC774\uB3C4\uB3D9" },
        { slug: "\uC77C\uB3C4\uB3D9", name: "\uC77C\uB3C4\uB3D9" }
      ] },
      { slug: "\uC11C\uADC0\uD3EC\uC2DC", name: "\uC11C\uADC0\uD3EC\uC2DC", nameEn: "Seogwipo-si", dongs: [
        { slug: "\uC911\uC559\uB3D9", name: "\uC911\uC559\uB3D9" },
        { slug: "\uC11C\uD64D\uB3D9", name: "\uC11C\uD64D\uB3D9" },
        { slug: "\uB300\uC815\uC74D", name: "\uB300\uC815\uC74D" },
        { slug: "\uC131\uC0B0\uC74D", name: "\uC131\uC0B0\uC74D" }
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
      { slug: "\uCD98\uCC9C\uC2DC", name: "\uCD98\uCC9C\uC2DC", nameEn: "Chuncheon", dongs: [
        { slug: "\uC870\uC6B4\uB3D9", name: "\uC870\uC6B4\uB3D9" },
        { slug: "\uD6A8\uC790\uB3D9", name: "\uD6A8\uC790\uB3D9" }
      ] },
      { slug: "\uC6D0\uC8FC\uC2DC", name: "\uC6D0\uC8FC\uC2DC", nameEn: "Wonju", dongs: [
        { slug: "\uC911\uC559\uB3D9", name: "\uC911\uC559\uB3D9" },
        { slug: "\uB2E8\uAD6C\uB3D9", name: "\uB2E8\uAD6C\uB3D9" }
      ] },
      { slug: "\uAC15\uB989\uC2DC", name: "\uAC15\uB989\uC2DC", nameEn: "Gangneung", dongs: [
        { slug: "\uAD50\uB3D9", name: "\uAD50\uB3D9" },
        { slug: "\uC1A1\uC815\uB3D9", name: "\uC1A1\uC815\uB3D9" }
      ] },
      { slug: "\uC18D\uCD08\uC2DC", name: "\uC18D\uCD08\uC2DC", nameEn: "Sokcho", dongs: [
        { slug: "\uAD50\uB3D9", name: "\uAD50\uB3D9" },
        { slug: "\uC601\uB791\uB3D9", name: "\uC601\uB791\uB3D9" }
      ] },
      { slug: "\uD3C9\uCC3D\uAD70", name: "\uD3C9\uCC3D\uAD70", nameEn: "Pyeongchang", dongs: [
        { slug: "\uB300\uAD00\uB839\uBA74", name: "\uB300\uAD00\uB839\uBA74" },
        { slug: "\uD3C9\uCC3D\uC74D", name: "\uD3C9\uCC3D\uC74D" }
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
      { slug: "\uCCAD\uC8FC\uC2DC", name: "\uCCAD\uC8FC\uC2DC", nameEn: "Cheongju", dongs: [
        { slug: "\uC0C1\uB2F9\uAD6C", name: "\uC0C1\uB2F9\uAD6C" },
        { slug: "\uC11C\uC6D0\uAD6C", name: "\uC11C\uC6D0\uAD6C" }
      ] },
      { slug: "\uCDA9\uC8FC\uC2DC", name: "\uCDA9\uC8FC\uC2DC", nameEn: "Chungju", dongs: [
        { slug: "\uC131\uB0B4\uB3D9", name: "\uC131\uB0B4\uB3D9" },
        { slug: "\uC5F0\uC218\uB3D9", name: "\uC5F0\uC218\uB3D9" }
      ] },
      { slug: "\uC81C\uCC9C\uC2DC", name: "\uC81C\uCC9C\uC2DC", nameEn: "Jecheon", dongs: [
        { slug: "\uC911\uC559\uB85C", name: "\uC911\uC559\uB85C" },
        { slug: "\uCCAD\uC804\uB3D9", name: "\uCCAD\uC804\uB3D9" }
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
      { slug: "\uCC9C\uC548\uC2DC", name: "\uCC9C\uC548\uC2DC", nameEn: "Cheonan", dongs: [
        { slug: "\uB3D9\uB0A8\uAD6C", name: "\uB3D9\uB0A8\uAD6C" },
        { slug: "\uC11C\uBD81\uAD6C", name: "\uC11C\uBD81\uAD6C" }
      ] },
      { slug: "\uC544\uC0B0\uC2DC", name: "\uC544\uC0B0\uC2DC", nameEn: "Asan", dongs: [
        { slug: "\uBC30\uBC29\uC74D", name: "\uBC30\uBC29\uC74D" },
        { slug: "\uC628\uC591\uB3D9", name: "\uC628\uC591\uB3D9" }
      ] },
      { slug: "\uACF5\uC8FC\uC2DC", name: "\uACF5\uC8FC\uC2DC", nameEn: "Gongju", dongs: [
        { slug: "\uC6C5\uC9C4\uB3D9", name: "\uC6C5\uC9C4\uB3D9" },
        { slug: "\uAE08\uD559\uB3D9", name: "\uAE08\uD559\uB3D9" }
      ] },
      { slug: "\uC11C\uC0B0\uC2DC", name: "\uC11C\uC0B0\uC2DC", nameEn: "Seosan", dongs: [
        { slug: "\uB3D9\uBB38\uB3D9", name: "\uB3D9\uBB38\uB3D9" },
        { slug: "\uC218\uC11D\uB3D9", name: "\uC218\uC11D\uB3D9" }
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
      { slug: "\uC804\uC8FC\uC2DC", name: "\uC804\uC8FC\uC2DC", nameEn: "Jeonju", dongs: [
        { slug: "\uC644\uC0B0\uAD6C", name: "\uC644\uC0B0\uAD6C" },
        { slug: "\uB355\uC9C4\uAD6C", name: "\uB355\uC9C4\uAD6C" }
      ] },
      { slug: "\uAD70\uC0B0\uC2DC", name: "\uAD70\uC0B0\uC2DC", nameEn: "Gunsan", dongs: [
        { slug: "\uC6D4\uBA85\uB3D9", name: "\uC6D4\uBA85\uB3D9" },
        { slug: "\uC218\uC1A1\uB3D9", name: "\uC218\uC1A1\uB3D9" }
      ] },
      { slug: "\uC775\uC0B0\uC2DC", name: "\uC775\uC0B0\uC2DC", nameEn: "Iksan", dongs: [
        { slug: "\uC601\uB4F1\uB3D9", name: "\uC601\uB4F1\uB3D9" },
        { slug: "\uBD80\uC1A1\uB3D9", name: "\uBD80\uC1A1\uB3D9" }
      ] },
      { slug: "\uC815\uC74D\uC2DC", name: "\uC815\uC74D\uC2DC", nameEn: "Jeongeup", dongs: [
        { slug: "\uC0C1\uB3D9", name: "\uC0C1\uB3D9" },
        { slug: "\uC2DC\uAE30\uB3D9", name: "\uC2DC\uAE30\uB3D9" }
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
      { slug: "\uBAA9\uD3EC\uC2DC", name: "\uBAA9\uD3EC\uC2DC", nameEn: "Mokpo", dongs: [
        { slug: "\uC0C1\uB3D9", name: "\uC0C1\uB3D9" },
        { slug: "\uD558\uB2F9\uB3D9", name: "\uD558\uB2F9\uB3D9" }
      ] },
      { slug: "\uC5EC\uC218\uC2DC", name: "\uC5EC\uC218\uC2DC", nameEn: "Yeosu", dongs: [
        { slug: "\uC911\uC559\uB3D9", name: "\uC911\uC559\uB3D9" },
        { slug: "\uB3CC\uC0B0\uC74D", name: "\uB3CC\uC0B0\uC74D" }
      ] },
      { slug: "\uC21C\uCC9C\uC2DC", name: "\uC21C\uCC9C\uC2DC", nameEn: "Suncheon", dongs: [
        { slug: "\uC911\uC559\uB3D9", name: "\uC911\uC559\uB3D9" },
        { slug: "\uC870\uB840\uB3D9", name: "\uC870\uB840\uB3D9" }
      ] },
      { slug: "\uAD11\uC591\uC2DC", name: "\uAD11\uC591\uC2DC", nameEn: "Gwangyang", dongs: [
        { slug: "\uC911\uB9C8\uB3D9", name: "\uC911\uB9C8\uB3D9" },
        { slug: "\uAD11\uC591\uC74D", name: "\uAD11\uC591\uC74D" }
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
      { slug: "\uD3EC\uD56D\uC2DC", name: "\uD3EC\uD56D\uC2DC", nameEn: "Pohang", dongs: [
        { slug: "\uB0A8\uAD6C", name: "\uB0A8\uAD6C" },
        { slug: "\uBD81\uAD6C", name: "\uBD81\uAD6C" }
      ] },
      { slug: "\uACBD\uC8FC\uC2DC", name: "\uACBD\uC8FC\uC2DC", nameEn: "Gyeongju", dongs: [
        { slug: "\uD669\uC131\uB3D9", name: "\uD669\uC131\uB3D9" },
        { slug: "\uBCF4\uBB38\uB3D9", name: "\uBCF4\uBB38\uB3D9" }
      ] },
      { slug: "\uAD6C\uBBF8\uC2DC", name: "\uAD6C\uBBF8\uC2DC", nameEn: "Gumi", dongs: [
        { slug: "\uC6D0\uD3C9\uB3D9", name: "\uC6D0\uD3C9\uB3D9" },
        { slug: "\uC778\uB3D9\uB3D9", name: "\uC778\uB3D9\uB3D9" }
      ] },
      { slug: "\uC548\uB3D9\uC2DC", name: "\uC548\uB3D9\uC2DC", nameEn: "Andong", dongs: [
        { slug: "\uC625\uB3D9", name: "\uC625\uB3D9" },
        { slug: "\uD0DC\uD654\uB3D9", name: "\uD0DC\uD654\uB3D9" }
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
      { slug: "\uCC3D\uC6D0\uC2DC", name: "\uCC3D\uC6D0\uC2DC", nameEn: "Changwon", dongs: [
        { slug: "\uC758\uCC3D\uAD6C", name: "\uC758\uCC3D\uAD6C" },
        { slug: "\uC131\uC0B0\uAD6C", name: "\uC131\uC0B0\uAD6C" }
      ] },
      { slug: "\uC9C4\uC8FC\uC2DC", name: "\uC9C4\uC8FC\uC2DC", nameEn: "Jinju", dongs: [
        { slug: "\uC0C1\uB300\uB3D9", name: "\uC0C1\uB300\uB3D9" },
        { slug: "\uC2E0\uC548\uB3D9", name: "\uC2E0\uC548\uB3D9" }
      ] },
      { slug: "\uAE40\uD574\uC2DC", name: "\uAE40\uD574\uC2DC", nameEn: "Gimhae", dongs: [
        { slug: "\uB0B4\uC678\uB3D9", name: "\uB0B4\uC678\uB3D9" },
        { slug: "\uC7A5\uC720\uB3D9", name: "\uC7A5\uC720\uB3D9" }
      ] },
      { slug: "\uAC70\uC81C\uC2DC", name: "\uAC70\uC81C\uC2DC", nameEn: "Geoje", dongs: [
        { slug: "\uACE0\uD604\uB3D9", name: "\uACE0\uD604\uB3D9" },
        { slug: "\uC625\uD3EC\uB3D9", name: "\uC625\uD3EC\uB3D9" }
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
    slug: "\uD0A4\uC624\uC2A4\uD06C",
    name: "\uD0A4\uC624\uC2A4\uD06C",
    nameEn: "Kiosk",
    icon: "\u{1F916}",
    tagline: "\uBB34\uC778 \uC8FC\uBB38\xB7\uACB0\uC81C",
    description: "\uBB34\uC778 \uC8FC\uBB38\xB7\uACB0\uC81C\uB85C \uD640 \uC778\uAC74\uBE44 \uC6D4 200\uB9CC\uC6D0 \uC808\uAC10. \uC18C\uD615 \uB9E4\uC7A5\uBD80\uD130 \uB300\uD615 \uD504\uB79C\uCC28\uC774\uC988\uAE4C\uC9C0.",
    metaCount: "5\uAC00\uC9C0 \uC0AC\uC774\uC988",
    featured: true,
    features: [
      "\uBBF8\uB2C8 \uD0A4\uC624\uC2A4\uD06C (\uBD84\uC2DD\uC9D1\xB7\uC791\uC740 \uCE74\uD398)",
      "\uC2A4\uD0E0\uB529 \uD0A4\uC624\uC2A4\uD06C (\uC911\uD615 \uB9E4\uC7A5)",
      "\uBCBD\uAC78\uC774 \uD0A4\uC624\uC2A4\uD06C (\uC881\uC740 \uACF5\uAC04)",
      "\uB300\uD615 \uD0A4\uC624\uC2A4\uD06C (\uD504\uB79C\uCC28\uC774\uC988)",
      "\uC774\uC911\uD654\uBA74 \uD0A4\uC624\uC2A4\uD06C (\uAD11\uACE0 \uBCD1\uD589)"
    ],
    useCases: [
      "\uD640 \uC778\uAC74\uBE44 \uC6D4 200\uB9CC\uC6D0 \uC774\uC0C1 \uC808\uAC10",
      "\uD53C\uD06C \uD0C0\uC784 \uC8FC\uBB38 \uB300\uAE30 \uC2DC\uAC04 \uB2E8\uCD95",
      "24\uC2DC\uAC04 \uBB34\uC778 \uB9E4\uC7A5 \uC804\uD658"
    ],
    specifications: {
      title: "\uC7A5\uBE44 \uC0AC\uC591",
      items: [
        { label: "\uD654\uBA74 \uD06C\uAE30", value: "15 / 22 / 27 / 32 / 43\uC778\uCE58 \uC120\uD0DD" },
        { label: "\uACB0\uC81C \uC9C0\uC6D0", value: "\uCE74\uB4DC \xB7 \uC0BC\uC131\uD398\uC774 \xB7 \uC560\uD50C\uD398\uC774 \xB7 QR \xB7 \uD604\uAE08" },
        { label: "\uC5B8\uC5B4 \uC9C0\uC6D0", value: "\uD55C\uAD6D\uC5B4 / English / \u4E2D\u6587 / \u65E5\u672C\u8A9E" },
        { label: "POS \uC5F0\uB3D9", value: "\uAE30\uC874 POS \uC2DC\uC2A4\uD15C\uACFC \uC2E4\uC2DC\uAC04 \uB3D9\uAE30\uD654" },
        { label: "\uD504\uB9B0\uD130", value: "\uC601\uC218\uC99D \uC790\uB3D9 \xB7 \uC8FC\uBC29 \uC8FC\uBB38\uD45C \uCD9C\uB825" },
        { label: "\uC6D0\uACA9 \uAD00\uB9AC", value: "\uBA54\uB274\xB7\uAC00\uACA9 \uC6D0\uACA9 \uC5C5\uB370\uC774\uD2B8 \xB7 \uC7A5\uC560 \uBAA8\uB2C8\uD130\uB9C1" }
      ]
    },
    costSavings: {
      title: "\uC778\uAC74\uBE44 \uC808\uAC10 \uD6A8\uACFC",
      items: [
        { metric: "\uD640 \uC778\uAC74\uBE44", amount: "\uC6D4 200\uB9CC\uC6D0", description: "\uC8FC\uBB38 \uBC1B\uB294 \uC9C1\uC6D0 1\uBA85 \uC808\uC57D (\uCD5C\uC800\uC784\uAE08 + 4\uB300\uBCF4\uD5D8)" },
        { metric: "\uD53C\uD06C\uD0C0\uC784 \uB9E4\uCD9C", amount: "\uC6D4 180\uB9CC\uC6D0", description: "\uB300\uAE30\uC904 \uD574\uC18C\uB85C \uC774\uD0C8 \uACE0\uAC1D \uAC10\uC18C, \uAC1D\uC218 30% \uC99D\uAC00" },
        { metric: "24\uC2DC\uAC04 \uC6B4\uC601", amount: "\uC6D4 300\uB9CC\uC6D0", description: "\uC2EC\uC57C \uBB34\uC778 \uC6B4\uC601\uC73C\uB85C \uC601\uC5C5\uC2DC\uAC04 \uD655\uB300 (\uC2EC\uC57C \uC5C5\uC885 \uD55C\uC815)" }
      ]
    },
    installationCases: [
      {
        title: "\uD64D\uB300 \uBD84\uC2DD\uC9D1",
        location: "\uC11C\uC6B8 \uB9C8\uD3EC\uAD6C \uD64D\uC775\uB85C",
        businessType: "24\uC2DC\uAC04 \uBD84\uC2DD\uC9D1 (\uD14C\uC774\uBE14 12\uAC1C)",
        challenge: "\uC2EC\uC57C \uC2DC\uAC04 \uD63C\uC790 \uC6B4\uC601\uD558\uBA74\uC11C \uC8FC\uBB38\xB7\uC870\uB9AC \uBCD1\uD589 \uC5B4\uB824\uC6C0",
        solution: "\uBCBD\uAC78\uC774 \uD0A4\uC624\uC2A4\uD06C 2\uB300 + POS \uC5F0\uB3D9 + \uC8FC\uBC29 \uC790\uB3D9 \uCD9C\uB825",
        result: "\uC2EC\uC57C \uB9E4\uCD9C 150% \uC99D\uAC00, \uC778\uAC74\uBE44 \uC6D4 200\uB9CC\uC6D0 \uC808\uAC10, \uC8FC\uBB38 \uC2E4\uC218 \uC81C\uB85C"
      },
      {
        title: "\uC77C\uC0B0 \uBC84\uAC70 \uD504\uB79C\uCC28\uC774\uC988",
        location: "\uACBD\uAE30 \uACE0\uC591\uC2DC \uC77C\uC0B0\uB3D9\uAD6C",
        businessType: "\uBC84\uAC70 \uD504\uB79C\uCC28\uC774\uC988 \uC9C1\uC601\uC810",
        challenge: "\uC810\uC2EC \uD53C\uD06C\uD0C0\uC784 \uCE74\uC6B4\uD130 \uB300\uAE30\uC904\uB85C \uACE0\uAC1D \uC774\uD0C8",
        solution: "43\uC778\uCE58 \uB300\uD615 \uD0A4\uC624\uC2A4\uD06C 4\uB300 + \uC774\uC911\uD654\uBA74 \uAD11\uACE0",
        result: "\uD3C9\uADE0 \uC8FC\uBB38 \uC2DC\uAC04 40\uCD08\uB85C \uB2E8\uCD95, \uD53C\uD06C\uD0C0\uC784 \uB9E4\uCD9C 45% \uC99D\uAC00"
      }
    ],
    faq: [
      {
        question: "\uC5B4\uB974\uC2E0 \uACE0\uAC1D\uB4E4\uC774 \uD0A4\uC624\uC2A4\uD06C \uC0AC\uC6A9\uC744 \uC5B4\uB824\uC6CC\uD558\uC9C0 \uC54A\uC744\uAE4C\uC694?",
        answer: "\uD070 \uAE00\uC528 \uBAA8\uB4DC, \uC74C\uC131 \uC548\uB0B4, \uAC04\uB2E8\uD55C UI\uB85C \uC124\uACC4\uB418\uC5B4 \uC788\uC5B4\uC694. \uD544\uC694 \uC2DC \uC9C1\uC6D0\uC774 \uD55C \uBC88\uB9CC \uB3C4\uC640\uB4DC\uB9AC\uBA74 \uB2E4\uC74C\uBD80\uD130\uB294 \uD63C\uC790 \uC798 \uC0AC\uC6A9\uD558\uC138\uC694."
      },
      {
        question: "\uACE0\uC7A5\uB098\uBA74 \uB9E4\uC7A5 \uC6B4\uC601\uC774 \uBD88\uAC00\uB2A5\uD55C \uAC70 \uC544\uB2CC\uAC00\uC694?",
        answer: "\uC8FC\uBB38 \uCE74\uC6B4\uD130\uB97C \uBC31\uC5C5\uC73C\uB85C \uB450\uACE0, \uC6D0\uACA9 \uBAA8\uB2C8\uD130\uB9C1\uC73C\uB85C \uC7A5\uC560\uB97C \uC989\uC2DC \uAC10\uC9C0\uD574\uC694. \uD3C9\uADE0 2\uC2DC\uAC04 \uB0B4 \uD604\uC7A5 \uBC29\uBB38 \uC218\uB9AC \uBCF4\uC7A5."
      },
      {
        question: "\uC791\uC740 \uB9E4\uC7A5\uC5D0\uB3C4 \uC124\uCE58\uD560 \uC218 \uC788\uB098\uC694?",
        answer: "15\uC778\uCE58 \uBBF8\uB2C8 \uB610\uB294 \uBCBD\uAC78\uC774\uD615\uC774 \uC788\uC5B4\uC11C 1\uD3C9 \uACF5\uAC04\uB9CC \uC788\uC73C\uBA74 \uC124\uCE58 \uAC00\uB2A5\uD574\uC694. \uCE74\uC6B4\uD130 \uC606 1m \uBCBD\uBA74\uB9CC \uC788\uC73C\uBA74 OK."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uD328\uC2A4\uD2B8\uD478\uB4DC\xB7\uBD84\uC2DD\uC9D1",
        description: "\uBE60\uB978 \uC8FC\uBB38\uACFC \uD68C\uC804\uC774 \uC0DD\uBA85\uC778 \uC5C5\uC885",
        benefits: ["\uC8FC\uBB38 \uC18D\uB3C4 3\uBC30 \uD5A5\uC0C1", "\uD53C\uD06C\uD0C0\uC784 \uB300\uAE30\uC904 \uD574\uC18C", "\uC2EC\uC57C \uBB34\uC778 \uC6B4\uC601"]
      },
      {
        industry: "\uCE74\uD398\xB7\uBCA0\uC774\uCEE4\uB9AC",
        description: "\uBA54\uB274\uAC00 \uB9CE\uACE0 \uCEE4\uC2A4\uD130\uB9C8\uC774\uC9D5\uC774 \uC911\uC694",
        benefits: ["\uBA54\uB274 \uC774\uBBF8\uC9C0 \uC0C1\uC138 \uD45C\uC2DC", "\uC635\uC158 \uC120\uD0DD \uD3B8\uB9AC", "\uBA64\uBC84\uC2ED \uC790\uB3D9 \uC801\uB9BD"]
      },
      {
        industry: "\uC601\uD654\uAD00\xB7\uB180\uC774\uC2DC\uC124",
        description: "\uB300\uB7C9 \uC8FC\uBB38 \uCC98\uB9AC\uC640 \uAD11\uACE0 \uD6A8\uACFC \uD544\uC694",
        benefits: ["\uB300\uD615 \uD654\uBA74 \uAD11\uACE0 \uBCD1\uD589", "\uB2E8\uCCB4 \uC8FC\uBB38 \uCC98\uB9AC", "\uC608\uB9E4 \uC5F0\uB3D9"]
      }
    ],
    relatedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", "\uD14C\uC774\uBE14\uC624\uB354"]
  },
  {
    slug: "\uD14C\uC774\uBE14\uC624\uB354",
    name: "\uD14C\uC774\uBE14\uC624\uB354",
    nameEn: "Table Order",
    icon: "\u{1F4F1}",
    tagline: "QR\uCF54\uB4DC\uB85C \uD14C\uC774\uBE14 \uC8FC\uBB38",
    description: "QR\uCF54\uB4DC \uC2A4\uCE94\uC73C\uB85C \uD14C\uC774\uBE14\uC5D0\uC11C \uBC14\uB85C \uC8FC\uBB38. \uD640 \uC11C\uBE59 \uC778\uB825 50% \uC808\uAC10\uD558\uBA70 \uB9E4\uCD9C\uC740 20% \uC0C1\uC2B9.",
    metaCount: "3\uAC00\uC9C0 \uBC29\uC2DD",
    features: [
      "QR\uCF54\uB4DC \uC2A4\uCE94 \uC8FC\uBB38",
      "\uC2E4\uC2DC\uAC04 \uC8FC\uBC29 \uC804\uC1A1",
      "\uBAA8\uBC14\uC77C \uACB0\uC81C \uC5F0\uB3D9",
      "\uB2E4\uAD6D\uC5B4 \uC9C0\uC6D0 (\uD55C\xB7\uC601\xB7\uC911\xB7\uC77C)",
      "\uC54C\uB808\uB974\uAE30 \uC815\uBCF4 \uD45C\uC2DC",
      "\uCD94\uCC9C \uBA54\uB274 \uC790\uB3D9 \uC81C\uC548"
    ],
    useCases: [
      "\uC11C\uBE59 \uC778\uB825 50% \uC808\uAC10",
      "\uC8FC\uBB38 \uC2E4\uC218 90% \uAC10\uC18C",
      "\uD14C\uC774\uBE14 \uD68C\uC804\uC728 30% \uD5A5\uC0C1"
    ],
    specifications: {
      title: "\uC2DC\uC2A4\uD15C \uC0AC\uC591",
      items: [
        { label: "\uC8FC\uBB38 \uBC29\uC2DD", value: "QR\uCF54\uB4DC \uC2A4\uCE94 \u2192 \uBAA8\uBC14\uC77C \uC6F9 \uC8FC\uBB38" },
        { label: "\uACB0\uC81C \uC5F0\uB3D9", value: "\uD1A0\uC2A4\uD398\uC774/\uCE74\uCE74\uC624\uD398\uC774/\uB124\uC774\uBC84\uD398\uC774/\uCE74\uB4DC" },
        { label: "\uC5B8\uC5B4 \uC9C0\uC6D0", value: "\uD55C\uAD6D\uC5B4/English/\u4E2D\u6587/\u65E5\u672C\u8A9E" },
        { label: "\uC8FC\uBC29 \uC5F0\uB3D9", value: "\uC2E4\uC2DC\uAC04 \uD504\uB9B0\uD130 \uCD9C\uB825 + \uBAA8\uB2C8\uD130 \uD45C\uC2DC" },
        { label: "\uAD00\uB9AC\uC790 \uC571", value: "iOS/Android \uBA54\uB274 \uAD00\uB9AC \uC571" },
        { label: "\uB370\uC774\uD130 \uBD84\uC11D", value: "\uC2DC\uAC04\uB300\uBCC4/\uBA54\uB274\uBCC4 \uC8FC\uBB38 \uD1B5\uACC4 \uC81C\uACF5" }
      ]
    },
    costSavings: {
      title: "\uC6B4\uC601\uBE44 \uC808\uC57D \uD6A8\uACFC",
      items: [
        { metric: "\uC778\uAC74\uBE44 \uC808\uC57D", amount: "\uC6D4 180\uB9CC\uC6D0", description: "\uC11C\uBE59 \uC9C1\uC6D0 1\uBA85 \uC808\uC57D \uD6A8\uACFC (\uCD5C\uC800\uC784\uAE08 200\uB9CC\uC6D0 \u2192 20\uB9CC\uC6D0)" },
        { metric: "\uC8FC\uBB38 \uC2E4\uC218 \uBC29\uC9C0", amount: "\uC6D4 25\uB9CC\uC6D0", description: "\uC798\uBABB\uB41C \uC8FC\uBB38\uC73C\uB85C \uC778\uD55C \uC74C\uC2DD \uC190\uC2E4 90% \uAC10\uC18C" },
        { metric: "\uB9E4\uCD9C \uC99D\uAC00", amount: "\uC6D4 300\uB9CC\uC6D0", description: "\uCD94\uCC9C \uBA54\uB274\uC640 \uBE60\uB978 \uC8FC\uBB38\uC73C\uB85C \uAC1D\uB2E8\uAC00 15% \uC0C1\uC2B9" }
      ]
    },
    installationCases: [
      {
        title: "\uD64D\uB300 \uBE0C\uB7F0\uCE58 \uCE74\uD398",
        location: "\uC11C\uC6B8 \uB9C8\uD3EC\uAD6C \uD64D\uC775\uB85C",
        businessType: "\uBE0C\uB7F0\uCE58 \uC804\uBB38 \uCE74\uD398 (\uD14C\uC774\uBE14 20\uAC1C)",
        challenge: "\uC8FC\uB9D0 \uB300\uAE30\uC904\uB85C \uC778\uD55C \uACE0\uAC1D \uC774\uD0C8, \uC11C\uBE59 \uC9C1\uC6D0 \uBD80\uC871\uC73C\uB85C \uC8FC\uBB38 \uC9C0\uC5F0",
        solution: "\uD14C\uC774\uBE14\uBCC4 QR \uC8FC\uBB38 + \uC120\uACB0\uC81C \uC2DC\uC2A4\uD15C + \uC8FC\uBC29 \uC2E4\uC2DC\uAC04 \uC5F0\uB3D9",
        result: "\uB300\uAE30\uC2DC\uAC04 60% \uB2E8\uCD95, \uC8FC\uB9D0 \uB9E4\uCD9C 35% \uC99D\uAC00, \uC11C\uBE59 \uC9C1\uC6D0 2\uBA85\u21921\uBA85 \uC6B4\uC601"
      },
      {
        title: "\uC774\uD0DC\uC6D0 \uD55C\uC2DD\uB2F9",
        location: "\uC11C\uC6B8 \uC6A9\uC0B0\uAD6C \uC774\uD0DC\uC6D0\uB3D9",
        businessType: "\uC678\uAD6D\uC778 \uAD00\uAD11\uAC1D \uB300\uC0C1 \uD55C\uC2DD\uB2F9",
        challenge: "\uC5B8\uC5B4 \uC18C\uD1B5 \uBB38\uC81C\uB85C \uC8FC\uBB38 \uC624\uB958 \uBE48\uBC1C, \uBA54\uB274 \uC124\uBA85\uC5D0 \uC2DC\uAC04 \uC18C\uC694",
        solution: "4\uAC1C\uAD6D\uC5B4 \uD14C\uC774\uBE14\uC624\uB354 + \uBA54\uB274 \uC0AC\uC9C4/\uC124\uBA85 \uC0C1\uC138\uD654 + \uC54C\uB808\uB974\uAE30 \uC815\uBCF4",
        result: "\uC8FC\uBB38 \uC624\uB958 95% \uAC10\uC18C, \uC678\uAD6D\uC778 \uACE0\uAC1D \uB9CC\uC871\uB3C4 4.8/5\uC810, \uD68C\uC804\uC728 25% \uD5A5\uC0C1"
      }
    ],
    faq: [
      {
        question: "\uACE0\uAC1D\uB4E4\uC774 QR\uCF54\uB4DC \uC8FC\uBB38\uC744 \uC5B4\uB824\uC6CC\uD558\uC9C0 \uC54A\uB098\uC694?",
        answer: "\uCC98\uC74C 2-3\uC77C\uC740 \uC548\uB0B4\uAC00 \uD544\uC694\uD558\uC9C0\uB9CC, \uC774\uD6C4\uC5D4 \uC624\uD788\uB824 \uACE0\uAC1D\uB4E4\uC774 \uB354 \uD3B8\uD558\uB2E4\uACE0 \uD569\uB2C8\uB2E4. \uB300\uAE30 \uC5C6\uC774 \uBC14\uB85C \uC8FC\uBB38\uD560 \uC218 \uC788\uACE0, \uBA54\uB274\uB97C \uCC9C\uCC9C\uD788 \uBCFC \uC218 \uC788\uC5B4\uC11C \uB9CC\uC871\uB3C4\uAC00 \uB192\uC544\uC694."
      },
      {
        question: "\uAE30\uC874 POS\uC640 \uC5F0\uB3D9\uC774 \uB418\uB098\uC694?",
        answer: "\uB300\uBD80\uBD84\uC758 POS \uC2DC\uC2A4\uD15C\uACFC \uC5F0\uB3D9 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uC8FC\uBB38 \uB370\uC774\uD130\uAC00 POS\uB85C \uC790\uB3D9 \uC804\uC1A1\uB418\uC5B4 \uC7AC\uACE0 \uAD00\uB9AC\uC640 \uB9E4\uCD9C \uC815\uC0B0\uC774 \uD1B5\uD569\uC801\uC73C\uB85C \uCC98\uB9AC\uB429\uB2C8\uB2E4."
      },
      {
        question: "\uBA54\uB274 \uBCC0\uACBD\uC774\uB098 \uAC00\uACA9 \uC218\uC815\uC740 \uC5B4\uB5BB\uAC8C \uD558\uB098\uC694?",
        answer: "\uAD00\uB9AC\uC790 \uC571\uC5D0\uC11C \uC2E4\uC2DC\uAC04\uC73C\uB85C \uBA54\uB274 \uCD94\uAC00/\uC0AD\uC81C/\uAC00\uACA9 \uBCC0\uACBD\uC774 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uD488\uC808 \uCC98\uB9AC\uB3C4 \uC6D0\uD130\uCE58\uB85C \uC989\uC2DC \uBC18\uC601\uB3FC\uC694."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uCE74\uD398\xB7\uBE0C\uB7F0\uCE58",
        description: "\uC80A\uC740 \uACE0\uAC1D\uCE35\uACFC \uD63C\uC7A1\uD55C \uD53C\uD06C\uD0C0\uC784\uC774 \uD2B9\uC9D5",
        benefits: ["\uB300\uAE30\uC904 \uD574\uC18C", "\uC120\uACB0\uC81C\uB85C \uBE60\uB978 \uD53D\uC5C5", "\uC778\uC2A4\uD0C0\uADF8\uB7A8 \uC5F0\uB3D9 \uC774\uBCA4\uD2B8"]
      },
      {
        industry: "\uD328\uBC00\uB9AC \uB808\uC2A4\uD1A0\uB791",
        description: "\uAC00\uC871 \uACE0\uAC1D\uACFC \uC544\uC774\uB4E4 \uBA54\uB274\uAC00 \uC911\uC694\uD55C \uC5C5\uC885",
        benefits: ["\uC544\uC774 \uBA54\uB274 \uBCC4\uB3C4 \uD45C\uC2DC", "\uC54C\uB808\uB974\uAE30 \uC815\uBCF4 \uC0C1\uC138", "\uAC00\uC871 \uC138\uD2B8 \uCD94\uCC9C"]
      },
      {
        industry: "\uD38D\xB7\uC774\uC790\uCE74\uC57C",
        description: "\uC220\uACFC \uC548\uC8FC \uC870\uD569\uC774 \uC911\uC694\uD55C \uC2EC\uC57C \uC5C5\uC885",
        benefits: ["\uC220+\uC548\uC8FC \uC790\uB3D9 \uCD94\uCC9C", "\uB2E4\uAD6D\uC5B4 \uBA54\uB274", "\uC2EC\uC57C \uBB34\uC778 \uC8FC\uBB38"]
      }
    ],
    relatedProducts: ["\uD3EC\uC2A4\uAE30", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", "\uD0A4\uC624\uC2A4\uD06C"]
  },
  {
    slug: "\uC778\uD130\uB137\uC124\uCE58",
    name: "\uC778\uD130\uB137 \uC124\uCE58",
    nameEn: "Internet Installation",
    icon: "\u{1F310}",
    tagline: "\uAE30\uAC00 \uC778\uD130\uB137\xB7\uC804\uC6A9\uC120\xB7\uBC31\uC5C5",
    description: "\uB9E4\uC7A5 \uC804\uC6A9 \uAE30\uAC00 \uC778\uD130\uB137\uBD80\uD130 POS \uC804\uC6A9\uC120\xB7\uBC31\uC5C5 \uD68C\uC120\uAE4C\uC9C0. \uD1B5\uC2E0\uC0AC\uBCC4 \uCD5C\uC800\uAC00 \uBE44\uAD50 \uD6C4 \uC124\uCE58.",
    metaCount: "4\uAC00\uC9C0 \uD68C\uC120",
    features: [
      "\uAE30\uAC00 \uC778\uD130\uB137 (500M~1G)",
      "POS \uC804\uC6A9\uC120 (\uC548\uC815\uC131 \uCD5C\uC6B0\uC120)",
      "\uBB34\uC120 \uC640\uC774\uD30C\uC774 \uD655\uC7A5",
      "\uBC31\uC5C5 \uD68C\uC120 (\uC7A5\uC560 \uB300\uBE44)",
      "CCTV \uC804\uC6A9 \uB124\uD2B8\uC6CC\uD06C",
      "VPN \uBCF4\uC548 \uC124\uC815"
    ],
    useCases: [
      "\uD1B5\uC2E0\uC0AC\uBCC4 \uC694\uAE08 \uCD5C\uB300 40% \uC808\uC57D",
      "POS\xB7\uD0A4\uC624\uC2A4\uD06C \uC548\uC815\uC131 100% \uBCF4\uC7A5",
      "\uB9E4\uC7A5 \uD655\uC7A5 \uC2DC \uB124\uD2B8\uC6CC\uD06C \uC124\uACC4"
    ],
    specifications: {
      title: "\uD68C\uC120 \uC0AC\uC591",
      items: [
        { label: "\uAE30\uAC00 \uC778\uD130\uB137", value: "\uB2E4\uC6B4 1Gbps / \uC5C5 500Mbps \uBCF4\uC7A5" },
        { label: "POS \uC804\uC6A9\uC120", value: "10Mbps \uBCF4\uC7A5 \xB7 \uC9C0\uC5F0\uC2DC\uAC04 10ms \uC774\uD558" },
        { label: "WiFi 6 \uB77C\uC6B0\uD130", value: "\uCD5C\uB300 200\uBA85 \uB3D9\uC2DC \uC811\uC18D \uC9C0\uC6D0" },
        { label: "\uBCF4\uC548", value: "WPA3 \uC554\uD638\uD654 \xB7 \uBC29\uD654\uBCBD \uAE30\uBCF8 \uD0D1\uC7AC" },
        { label: "\uD1B5\uC2E0\uC0AC", value: "KT \xB7 SK\uBE0C\uB85C\uB4DC\uBC34\uB4DC \xB7 LG U+ \uBAA8\uB450 \uBE44\uAD50" },
        { label: "AS \uB300\uC751", value: "\uD3C9\uC77C 2\uC2DC\uAC04 \xB7 \uD734\uC77C 4\uC2DC\uAC04 \uC774\uB0B4 \uBC29\uBB38" }
      ]
    },
    costSavings: {
      title: "\uD1B5\uC2E0\uBE44 \uC808\uC57D \uD6A8\uACFC",
      items: [
        { metric: "\uC6D4 \uD1B5\uC2E0\uBE44", amount: "\uC6D4 8\uB9CC\uC6D0", description: "3\uC0AC \uC694\uAE08 \uBE44\uAD50\uB85C \uB3D9\uC77C \uC870\uAC74 \uD3C9\uADE0 40% \uC808\uC57D" },
        { metric: "\uC7A5\uC560 \uC190\uC2E4", amount: "\uC6D4 200\uB9CC\uC6D0", description: "\uC548\uC815\uC801 \uC804\uC6A9\uC120\uC73C\uB85C \uACB0\uC81C \uC911\uB2E8 \uC0AC\uACE0 \uC81C\uB85C" },
        { metric: "\uC124\uCE58\uBE44 \uD61C\uD0DD", amount: "50\uB9CC\uC6D0", description: "3\uB144 \uC57D\uC815 \uC2DC \uC124\uCE58\uBE44 \uBB34\uB8CC + \uACF5\uC720\uAE30 \uBB34\uC0C1 \uC81C\uACF5" }
      ]
    },
    installationCases: [
      {
        title: "\uAC15\uB0A8 \uB300\uD615 \uCE74\uD398",
        location: "\uC11C\uC6B8 \uAC15\uB0A8\uAD6C \uC0BC\uC131\uB3D9",
        businessType: "\uD504\uB79C\uCC28\uC774\uC988 \uCE74\uD398 (200\uD3C9 \xB7 \uC88C\uC11D 80\uAC1C)",
        challenge: "\uD53C\uD06C\uD0C0\uC784 \uC640\uC774\uD30C\uC774 \uB04A\uAE40\uC73C\uB85C \uACE0\uAC1D \uBD88\uB9CC, POS \uACB0\uC81C \uC9C0\uC5F0",
        solution: "\uAE30\uAC00 \uC804\uC6A9\uC120 + POS \uBC31\uC5C5 \uD68C\uC120 + WiFi 6 \uB77C\uC6B0\uD130 4\uB300",
        result: "\uACE0\uAC1D \uBD88\uB9CC \uC81C\uB85C, \uACB0\uC81C \uC9C0\uC5F0 \uC644\uC804 \uD574\uACB0, \uD1B5\uC2E0\uBE44 \uC6D4 6\uB9CC\uC6D0 \uC808\uC57D"
      },
      {
        title: "\uD310\uAD50 \uC0AC\uBB34\uD615 \uBCA0\uC774\uCEE4\uB9AC",
        location: "\uACBD\uAE30 \uC131\uB0A8\uC2DC \uD310\uAD50",
        businessType: "IT\uAE30\uC5C5 \uB2E8\uC9C0 \uB0B4 \uBCA0\uC774\uCEE4\uB9AC (\uC9C1\uC7A5\uC778 \uACE0\uAC1D)",
        challenge: "\uB178\uD2B8\uBD81 \uACE0\uAC1D\uC6A9 WiFi\uC640 \uACB0\uC81C\uC6A9 \uD68C\uC120 \uBD84\uB9AC \uD544\uC694",
        solution: "\uACE0\uAC1D\uC6A9 WiFi + \uB9E4\uC7A5 \uC804\uC6A9 \uD68C\uC120 + \uBCF4\uC548 \uBD84\uB9AC \uC124\uC815",
        result: "\uACE0\uAC1D WiFi \uB9CC\uC871\uB3C4 \uCD5C\uC0C1, \uB9E4\uC7A5 \uB370\uC774\uD130 \uBCF4\uC548 \uC644\uBCBD"
      }
    ],
    faq: [
      {
        question: "\uAE30\uC874 \uC778\uD130\uB137\uC744 \uADF8\uB300\uB85C \uC4F0\uBA74 \uC548 \uB418\uB098\uC694?",
        answer: "\uAC00\uC815\uC6A9 \uC778\uD130\uB137\uC740 POS\xB7\uACB0\uC81C \uC2DC\uC2A4\uD15C\uC5D0 \uBD80\uC801\uD569\uD574\uC694. \uC7A5\uC560 \uC2DC \uC190\uC2E4\uC774 \uD06C\uBBC0\uB85C \uB9E4\uC7A5 \uC804\uC6A9 \uD68C\uC120\uC744 \uAF2D \uCD94\uCC9C\uB4DC\uB824\uC694."
      },
      {
        question: "\uD1B5\uC2E0\uC0AC\uB294 \uC5B4\uB5BB\uAC8C \uACB0\uC815\uB418\uB098\uC694?",
        answer: "\uB9E4\uC7A5 \uC8FC\uC18C \uAE30\uC900\uC73C\uB85C 3\uC0AC \uC694\uAE08\xB7\uC18D\uB3C4\uB97C \uBE44\uAD50\uD574\uC11C \uAC00\uC7A5 \uC720\uB9AC\uD55C \uACF3\uC73C\uB85C \uCD94\uCC9C\uD574\uB4DC\uB9BD\uB2C8\uB2E4. \uCD5C\uC885 \uACB0\uC815\uC740 \uACE0\uAC1D\uB2D8\uC774 \uD558\uC138\uC694."
      },
      {
        question: "\uACF5\uC0AC\uB294 \uC5BC\uB9C8\uB098 \uAC78\uB9AC\uB098\uC694?",
        answer: "\uC77C\uBC18 \uD68C\uC120\uC740 1-2\uC77C, POS \uC804\uC6A9\uC120\uC740 2-3\uC77C \uC18C\uC694\uB429\uB2C8\uB2E4. \uAE30\uC874 \uB9E4\uC7A5 \uC6B4\uC601\uC5D0 \uC9C0\uC7A5 \uC5C6\uB3C4\uB85D \uC601\uC5C5\uC2DC\uAC04 \uC678 \uC791\uC5C5 \uAC00\uB2A5\uD574\uC694."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uB300\uD615 \uB9E4\uC7A5",
        description: "\uACE0\uAC1D WiFi\uC640 \uC6B4\uC601 \uC2DC\uC2A4\uD15C \uBD84\uB9AC \uD544\uC694",
        benefits: ["\uAE30\uAC00 \uC778\uD130\uB137 + \uBCC4\uB3C4 WiFi", "\uBCF4\uC548 \uBD84\uB9AC \uC124\uC815", "\uD2B8\uB798\uD53D \uAD00\uB9AC"]
      },
      {
        industry: "IT \uD2B9\uD654 \uB9E4\uC7A5",
        description: "\uC548\uC815\uC131\uACFC \uC18D\uB3C4\uAC00 \uC0DD\uBA85\uC778 \uC5C5\uC885",
        benefits: ["\uC774\uC911\uD654 \uD68C\uC120", "5G \uBC31\uC5C5", "\uD488\uC9C8 \uBCF4\uC7A5 SLA"]
      },
      {
        industry: "\uD504\uB79C\uCC28\uC774\uC988",
        description: "\uBCF8\uC0AC \uC2DC\uC2A4\uD15C \uC5F0\uB3D9 \uD544\uC218",
        benefits: ["VPN \uBCF8\uC0AC \uC5F0\uACB0", "\uBCF4\uC548 \uB124\uD2B8\uC6CC\uD06C", "\uC6D0\uACA9 \uBAA8\uB2C8\uD130\uB9C1"]
      }
    ],
    relatedProducts: ["\uD3EC\uC2A4\uAE30", "\uD0A4\uC624\uC2A4\uD06C", "CCTV\uC124\uCE58"]
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
  },
  {
    slug: "\uC790\uD310\uAE30",
    name: "\uC790\uD310\uAE30",
    nameEn: "Vending Machine",
    icon: "\u{1F964}",
    tagline: "24\uC2DC\uAC04 \uBB34\uC778 \uD310\uB9E4",
    description: "\uC74C\uB8CC\xB7\uC2A4\uB0B5\xB7\uC0DD\uD544\uD488\uAE4C\uC9C0. \uBB34\uC778 \uB9E4\uC7A5\uC758 \uD544\uC218 \uC7A5\uBE44. \uCE74\uB4DC\xB7\uD604\uAE08\xB7\uBAA8\uBC14\uC77C \uACB0\uC81C \uBAA8\uB450 \uC9C0\uC6D0.",
    metaCount: "5\uAC00\uC9C0 \uD0C0\uC785",
    features: [
      "\uC74C\uB8CC \uC790\uD310\uAE30 (\uCE94\xB7\uD398\uD2B8\xB7\uCEF5)",
      "\uC2A4\uB0B5 \uC790\uD310\uAE30 (\uACFC\uC790\xB7\uBE75)",
      "\uBCF5\uD569 \uC790\uD310\uAE30 (\uC74C\uB8CC+\uC2A4\uB0B5)",
      "\uB0C9\uC7A5\xB7\uB0C9\uB3D9 \uC790\uD310\uAE30",
      "\uBB34\uC778 \uB9E4\uC810 \uC194\uB8E8\uC158"
    ],
    useCases: [
      "24\uC2DC\uAC04 \uBB34\uC778 \uB9E4\uCD9C \uCC3D\uCD9C",
      "\uC784\uB300\uB8CC \uB300\uBE44 \uB192\uC740 \uC218\uC775\uB960",
      "\uC720\uB3D9\uC778\uAD6C \uB9CE\uC740 \uC7A5\uC18C \uC124\uCE58"
    ],
    specifications: {
      title: "\uC7A5\uBE44 \uC0AC\uC591",
      items: [
        { label: "\uACB0\uC81C \uBC29\uC2DD", value: "\uCE74\uB4DC\xB7\uD604\uAE08\xB7\uC0BC\uC131\uD398\uC774\xB7\uCE74\uCE74\uC624\uD398\uC774\xB7QR" },
        { label: "\uC218\uC6A9\uB7C9", value: "\uC74C\uB8CC 300~500\uAC1C, \uC2A4\uB0B5 200~350\uAC1C" },
        { label: "\uB0C9\uC7A5 \uAE30\uB2A5", value: "2~8\xB0C \uC720\uC9C0, \uB0C9\uB3D9 \uC601\uD558 20\xB0C" },
        { label: "\uC6D0\uACA9 \uAD00\uB9AC", value: "\uC7AC\uACE0\xB7\uB9E4\uCD9C \uC2E4\uC2DC\uAC04 \uBAA8\uB2C8\uD130\uB9C1 \uC571" },
        { label: "\uC804\uB825", value: "\uC6D4 \uD3C9\uADE0 3~5\uB9CC\uC6D0 \uC218\uC900" },
        { label: "\uC124\uCE58 \uACF5\uAC04", value: "\uAC00\uB85C 90cm \xD7 \uC138\uB85C 75cm\uBD80\uD130" }
      ]
    },
    costSavings: {
      title: "\uC218\uC775 \uCC3D\uCD9C \uD6A8\uACFC",
      items: [
        { metric: "\uC6D4\uD3C9\uADE0 \uB9E4\uCD9C", amount: "80~200\uB9CC\uC6D0", description: "\uC704\uCE58 \uC88B\uC740 \uACF3 \uAE30\uC900 (\uC624\uD53C\uC2A4\xB7\uC6D0\uB8F8\xB7\uD559\uC6D0\uAC00)" },
        { metric: "\uC6B4\uC601\uBE44", amount: "\uC6D4 10\uB9CC\uC6D0", description: "\uC804\uAE30\uB8CC\xB7\uD1B5\uC2E0\uBE44\xB7\uC7AC\uACE0 \uAD00\uB9AC \uD3EC\uD568" },
        { metric: "\uC21C\uC774\uC775", amount: "\uC6D4 50~150\uB9CC\uC6D0", description: "\uC784\uB300\uB8CC \uC5C6\uB294 \uC704\uCE58 \uAE30\uC900 \uC21C\uC218\uC775" }
      ]
    },
    faq: [
      {
        question: "\uC124\uCE58 \uC7A5\uC18C\uB294 \uC5B4\uB5BB\uAC8C \uC815\uD558\uB098\uC694?",
        answer: "\uC720\uB3D9 \uC778\uAD6C\uC640 \uACE0\uAC1D\uCE35\uC744 \uBD84\uC11D\uD574 \uCD5C\uC801 \uC7A5\uC18C\uB97C \uCEE8\uC124\uD305\uD574\uB4DC\uB824\uC694. \uC624\uD53C\uC2A4\uBE4C\uB529, \uC6D0\uB8F8 \uBC00\uC9D1\uC9C0, \uD559\uC6D0\uAC00\uAC00 \uAC00\uC7A5 \uC218\uC775\uC131 \uB192\uC2B5\uB2C8\uB2E4."
      },
      {
        question: "\uC7AC\uACE0\uB294 \uC5B4\uB5BB\uAC8C \uCC44\uC6B0\uB098\uC694?",
        answer: "\uC6D0\uD558\uC2DC\uBA74 \uC800\uD76C\uAC00 \uC7AC\uACE0 \uAD00\uB9AC\uAE4C\uC9C0 \uB300\uD589\uD574\uB4DC\uB9BD\uB2C8\uB2E4(\uC218\uC218\uB8CC \uBCC4\uB3C4). \uC9C1\uC811 \uC6B4\uC601 \uC2DC \uC6D0\uACA9 \uC571\uC73C\uB85C \uC7AC\uACE0 \uBD80\uC871 \uC54C\uB9BC\uC744 \uBC1B\uC744 \uC218 \uC788\uC5B4\uC694."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uC624\uD53C\uC2A4\xB7\uC6D0\uB8F8",
        description: "24\uC2DC\uAC04 \uC720\uB3D9 \uC778\uAD6C\uAC00 \uC788\uB294 \uC7A5\uC18C",
        benefits: ["\uC2EC\uC57C \uB9E4\uCD9C \uBC1C\uC0DD", "\uBB34\uC778 \uC6B4\uC601", "\uC6D4 \uACE0\uC815 \uC218\uC775"]
      },
      {
        industry: "\uD559\uC6D0\xB7\uC2A4\uD130\uB514\uCE74\uD398",
        description: "\uD559\uC0DD \uC720\uB3D9\uC778\uAD6C \uC9D1\uC911 \uC7A5\uC18C",
        benefits: ["\uC74C\uB8CC \uC218\uC694 \uB192\uC74C", "\uC26C\uB294 \uC2DC\uAC04 \uC9D1\uC911 \uD310\uB9E4", "\uC7A5\uAE30 \uC6B4\uC601"]
      }
    ],
    relatedProducts: ["\uCE74\uB4DC\uB2E8\uB9D0\uAE30", "CCTV\uC124\uCE58"]
  },
  {
    slug: "\uAC74\uCD95\uCCA0\uAC70",
    name: "\uAC74\uCD95 (\uCCA0\uAC70)",
    nameEn: "Demolition",
    icon: "\u{1F3D7}\uFE0F",
    tagline: "\uB9E4\uC7A5 \uCCA0\uAC70\xB7\uD3D0\uAE30\uBB3C \uCC98\uB9AC",
    description: "\uAE30\uC874 \uB9E4\uC7A5 \uCCA0\uAC70\uBD80\uD130 \uD3D0\uAE30\uBB3C \uCC98\uB9AC\uAE4C\uC9C0. \uC2E0\uADDC \uB9E4\uC7A5 \uC778\uD14C\uB9AC\uC5B4 \uC804 \uC548\uC804\uD558\uACE0 \uAE54\uB054\uD558\uAC8C \uC815\uB9AC\uD574\uB4DC\uB9BD\uB2C8\uB2E4.",
    metaCount: "3\uAC00\uC9C0 \uC720\uD615",
    features: [
      "\uC804\uCCB4 \uCCA0\uAC70 (\uBC14\uB2E5\xB7\uBCBD\uCCB4\xB7\uCC9C\uC7A5)",
      "\uBD80\uBD84 \uCCA0\uAC70 (\uC778\uD14C\uB9AC\uC5B4\uB9CC)",
      "\uC7A5\uBE44 \uCCA0\uAC70 (POS\xB7\uC8FC\uBC29\uAE30\uAE30)",
      "\uD3D0\uAE30\uBB3C \uBD84\uB9AC \uBC30\uCD9C",
      "\uC6D0\uC0C1 \uBCF5\uAD6C \uCCA0\uAC70"
    ],
    useCases: [
      "\uC2E0\uADDC \uB9E4\uC7A5 \uC624\uD508 \uC804 \uC815\uB9AC",
      "\uC784\uB300 \uC885\uB8CC \uC2DC \uC6D0\uC0C1 \uBCF5\uAD6C",
      "\uC5C5\uC885 \uBCC0\uACBD \uC2DC \uB9AC\uB274\uC5BC \uC900\uBE44"
    ],
    specifications: {
      title: "\uC11C\uBE44\uC2A4 \uC0AC\uC591",
      items: [
        { label: "\uADDC\uBAA8", value: "5\uD3C9~100\uD3C9 \uC774\uC0C1 \uBAA8\uB450 \uAC00\uB2A5" },
        { label: "\uC791\uC5C5 \uC2DC\uAC04", value: "10\uD3C9 \uAE30\uC900 1~2\uC77C \uB0B4 \uC644\uB8CC" },
        { label: "\uD3D0\uAE30\uBB3C \uCC98\uB9AC", value: "\uC804\uB7C9 \uD569\uBC95 \uCC98\uB9AC (\uC99D\uBE59 \uC81C\uACF5)" },
        { label: "\uC6D0\uC0C1\uBCF5\uAD6C", value: "\uC784\uB300 \uACC4\uC57D\uC11C \uAE30\uC900 \uB9DE\uCDA4 \uBCF5\uAD6C" },
        { label: "\uBCF4\uD5D8", value: "\uC791\uC5C5 \uC911 \uC0AC\uACE0 \uB300\uBE44 \uC0B0\uC7AC \uAC00\uC785" },
        { label: "\uD604\uC7A5 \uD655\uC778", value: "\uBB34\uB8CC \uD604\uC7A5 \uC2E4\uC0AC \uBC0F \uACAC\uC801" }
      ]
    },
    costSavings: {
      title: "\uCCA0\uAC70 \uBE44\uC6A9 \uC808\uC57D",
      items: [
        { metric: "\uCCA0\uAC70\uBE44", amount: "20~40% \uC808\uC57D", description: "\uD0C0\uC0AC \uB300\uBE44 \uD569\uB9AC\uC801 \uACAC\uC801 (\uD3C9\uB2F9 8~15\uB9CC\uC6D0)" },
        { metric: "\uD3D0\uAE30\uBB3C \uCC98\uB9AC", amount: "\uD3EC\uD568", description: "\uBCC4\uB3C4 \uD3D0\uAE30\uBB3C \uC5C5\uCCB4 \uC218\uBC30 \uBD88\uD544\uC694" },
        { metric: "\uC6D0\uC0C1\uBCF5\uAD6C", amount: "\uBCF4\uC99D\uAE08 \uBCF4\uD638", description: "\uC784\uB300\uC778 \uC694\uAD6C\uC0AC\uD56D \uC815\uD655\uD788 \uC774\uD589" }
      ]
    },
    faq: [
      {
        question: "\uACAC\uC801\uC740 \uC5B4\uB5BB\uAC8C \uBC1B\uB098\uC694?",
        answer: "\uB9E4\uC7A5 \uC8FC\uC18C\uB9CC \uC54C\uB824\uC8FC\uC2DC\uBA74 \uD604\uC7A5 \uBC29\uBB38 \uD6C4 \uBB34\uB8CC \uACAC\uC801\uC744 \uB4DC\uB9BD\uB2C8\uB2E4. \uC0AC\uC9C4\xB7\uC601\uC0C1\uC73C\uB85C \uB300\uB7B5\uC801\uC778 \uACAC\uC801\uB3C4 \uAC00\uB2A5\uD569\uB2C8\uB2E4."
      },
      {
        question: "\uC601\uC5C5 \uC911\uC5D0\uB3C4 \uCCA0\uAC70 \uAC00\uB2A5\uD55C\uAC00\uC694?",
        answer: "\uBD80\uBD84 \uCCA0\uAC70\uB098 \uC57C\uAC04 \uC791\uC5C5\uC73C\uB85C \uC601\uC5C5 \uC911\uC5D0\uB3C4 \uAC00\uB2A5\uD574\uC694. \uC18C\uC74C\xB7\uBA3C\uC9C0 \uCD5C\uC18C\uD654 \uC791\uC5C5 \uBC29\uC2DD\uC744 \uC81C\uC548\uD574\uB4DC\uB9BD\uB2C8\uB2E4."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uC2E0\uADDC \uCC3D\uC5C5",
        description: "\uAE30\uC874 \uB9E4\uC7A5 \uC778\uC218 \uD6C4 \uB9AC\uBAA8\uB378\uB9C1 \uD544\uC694",
        benefits: ["\uC804\uCCB4 \uCCA0\uAC70", "\uC5C5\uC885 \uBCC0\uACBD", "\uC778\uD14C\uB9AC\uC5B4 \uC900\uBE44"]
      },
      {
        industry: "\uC784\uB300 \uC885\uB8CC",
        description: "\uACC4\uC57D \uB9CC\uB8CC \uC2DC \uC6D0\uC0C1 \uBCF5\uAD6C \uC758\uBB34",
        benefits: ["\uC6D0\uC0C1 \uBCF5\uAD6C", "\uBCF4\uC99D\uAE08 \uBCF4\uD638", "\uBD84\uC7C1 \uC608\uBC29"]
      }
    ],
    relatedProducts: ["\uAC74\uCD95\uC778\uD14C\uB9AC\uC5B4", "\uC778\uD130\uB137\uC124\uCE58"]
  },
  {
    slug: "\uAC74\uCD95\uC778\uD14C\uB9AC\uC5B4",
    name: "\uAC74\uCD95 (\uC778\uD14C\uB9AC\uC5B4)",
    nameEn: "Interior",
    icon: "\u{1F3A8}",
    tagline: "\uB9E4\uC7A5 \uC778\uD14C\uB9AC\uC5B4\xB7\uC2DC\uACF5",
    description: "\uC5C5\uC885\uBCC4 \uB9DE\uCDA4 \uC778\uD14C\uB9AC\uC5B4 \uB514\uC790\uC778\uBD80\uD130 \uC2DC\uACF5\uAE4C\uC9C0. \uCE74\uB4DC\uB2E8\uB9D0\uAE30\xB7POS\xB7\uD0A4\uC624\uC2A4\uD06C \uC124\uCE58\uAE4C\uC9C0 \uC6D0\uC2A4\uD1B1.",
    metaCount: "\uC5C5\uC885\uBCC4 \uB9DE\uCDA4",
    features: [
      "\uB514\uC790\uC778 \uCEE8\uC124\uD305",
      "\uC804\uAE30\xB7\uBC30\uAD00 \uACF5\uC0AC",
      "\uAC00\uAD6C\xB7\uC870\uBA85 \uC124\uCE58",
      "\uAC04\uD310\xB7\uC678\uC7A5 \uACF5\uC0AC",
      "\uC7A5\uBE44 \uC124\uCE58 \uC5F0\uACC4"
    ],
    useCases: [
      "\uC2E0\uADDC \uB9E4\uC7A5 \uC624\uD508",
      "\uAE30\uC874 \uB9E4\uC7A5 \uB9AC\uB274\uC5BC",
      "\uD504\uB79C\uCC28\uC774\uC988 \uC2DC\uACF5"
    ],
    specifications: {
      title: "\uC2DC\uACF5 \uBC94\uC704",
      items: [
        { label: "\uB514\uC790\uC778", value: "3D \uB3C4\uBA74 \uBB34\uB8CC \uC81C\uACF5" },
        { label: "\uADDC\uBAA8", value: "5\uD3C9~200\uD3C9 \uC774\uC0C1" },
        { label: "\uACF5\uC0AC \uAE30\uAC04", value: "10\uD3C9 \uAE30\uC900 2~3\uC8FC \uC644\uB8CC" },
        { label: "\uBCF4\uC99D", value: "\uC2DC\uACF5 \uD6C4 1\uB144 \uBB34\uC0C1 A/S" },
        { label: "\uC5F0\uACC4 \uC11C\uBE44\uC2A4", value: "\uCCA0\uAC70\xB7\uC7A5\uBE44\xB7\uAC04\uD310 \uC6D0\uC2A4\uD1B1" },
        { label: "\uC790\uC7AC", value: "\uCE5C\uD658\uACBD \uC778\uC99D \uC790\uC7AC \uC0AC\uC6A9" }
      ]
    },
    costSavings: {
      title: "\uC778\uD14C\uB9AC\uC5B4 \uBE44\uC6A9",
      items: [
        { metric: "\uD3C9\uB2F9 \uBE44\uC6A9", amount: "100~300\uB9CC\uC6D0", description: "\uC5C5\uC885\xB7\uB514\uC790\uC778 \uC218\uC900\uBCC4 \uCC28\uB4F1 (\uCE74\uD398\xB7\uC2DD\uB2F9 \uAE30\uC900)" },
        { metric: "\uC7A5\uBE44 \uC5F0\uACC4", amount: "5~10% \uC808\uC57D", description: "\uC778\uD14C\uB9AC\uC5B4+\uC7A5\uBE44 \uD328\uD0A4\uC9C0 \uC2DC \uD560\uC778 \uC801\uC6A9" },
        { metric: "A/S", amount: "1\uB144 \uBB34\uC0C1", description: "\uC2DC\uACF5 \uD6C4 1\uB144\uAC04 \uD558\uC790 \uBCF4\uC218 \uBB34\uC0C1" }
      ]
    },
    faq: [
      {
        question: "\uB514\uC790\uC778\uB9CC \uC758\uB8B0\uD560 \uC218 \uC788\uB098\uC694?",
        answer: "\uB124, \uB514\uC790\uC778\uB9CC \uC9C4\uD589\uD558\uAC70\uB098 \uC2DC\uACF5\uB9CC \uC9C4\uD589\uD558\uB294 \uAC83\uB3C4 \uAC00\uB2A5\uD574\uC694. \uC6D0\uD558\uC2DC\uB294 \uBC94\uC704\uB9CC\uD07C \uC720\uC5F0\uD558\uAC8C \uC9C4\uD589\uD569\uB2C8\uB2E4."
      },
      {
        question: "\uAE30\uAC04\uC740 \uC5BC\uB9C8\uB098 \uAC78\uB9AC\uB098\uC694?",
        answer: "10\uD3C9 \uCE74\uD398 \uAE30\uC900 \uC57D 2~3\uC8FC \uC18C\uC694\uB429\uB2C8\uB2E4. \uADDC\uBAA8\uC640 \uB514\uC790\uC778 \uBCF5\uC7A1\uB3C4\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C0\uB2C8 \uC815\uD655\uD55C \uC77C\uC815\uC740 \uC0C1\uB2F4 \uD6C4 \uC548\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4."
      }
    ],
    industryRecommendations: [
      {
        industry: "\uCE74\uD398\xB7\uBCA0\uC774\uCEE4\uB9AC",
        description: "\uAC10\uC131 \uB514\uC790\uC778\uC774 \uC911\uC694\uD55C \uC5C5\uC885",
        benefits: ["\uD2B8\uB80C\uB4DC \uBC18\uC601 \uB514\uC790\uC778", "\uD3EC\uD1A0\uC874 \uC124\uACC4", "SNS \uC778\uC2A4\uD0C0 \uAC10\uC131"]
      },
      {
        industry: "\uC2DD\uB2F9\xB7\uC220\uC9D1",
        description: "\uAE30\uB2A5\uC131\uACFC \uBD84\uC704\uAE30 \uBAA8\uB450 \uD544\uC694",
        benefits: ["\uC8FC\uBC29 \uB3D9\uC120 \uC124\uACC4", "\uD14C\uC774\uBE14 \uB808\uC774\uC544\uC6C3", "\uC870\uBA85 \uC5F0\uCD9C"]
      }
    ],
    relatedProducts: ["\uAC74\uCD95\uCCA0\uAC70", "\uCE74\uB4DC\uB2E8\uB9D0\uAE30", "CCTV\uC124\uCE58"]
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
            h1 { font-size: 72px; font-weight: 900; color: #FF6900; margin-bottom: 16px; letter-spacing: -0.05em; }
            p { color: #666; margin-bottom: 32px; }
            a { display: inline-block; background: #FF6900; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 2px; font-weight: 700; }
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
var src_default = app;
export {
  src_default as default
};
