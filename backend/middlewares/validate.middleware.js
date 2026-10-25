
export const validate = (schema, source = "body") => {
    return async (req, res, next) => {
        try {
            const validationResult = await schema.safeParseAsync(req[source]);

            if (!validationResult.success) {

                const firstIssue = validationResult.error.issues?.[0];
                const errorMsg =
                    firstIssue?.message || "Invalid request " + source;

                const error = new Error(errorMsg);
                error.status = 400;
                throw error;
            }

            if (source === "body") {
                req.body = validationResult.data;
            } else {
                // Express 5 exposes req.query / req.params as read-only getters
                Object.defineProperty(req, source, {
                    value: validationResult.data,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
