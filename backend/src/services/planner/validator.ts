import { QueryPlan } from '../../db/types';
import { ValidationError } from '../../utils/errors';
import { config } from '../../configs';
import { ERROR_MESSAGES, DEFAULT_TABLES, DEFAULT_COLLECTIONS } from '../../utils/constants';

const MAX_LIMIT = config.query.maxLimit;

export function validatePlan(plan: QueryPlan, schemaHint?: any): QueryPlan {
    if (!plan) {
        throw new ValidationError(ERROR_MESSAGES.EMPTY_PLAN);
    }

    // Allow ambiguous responses to pass through
    if ((plan as any).ambiguous) {
        return plan;
    }

    // Prevent raw SQL execution for security
    if (plan.operation === 'rawSql') {
        throw new ValidationError(ERROR_MESSAGES.RAW_SQL_NOT_PERMITTED);
    }

    // Enforce query limit
    if (plan.limit && plan.limit > MAX_LIMIT) {
        plan.limit = MAX_LIMIT;
    }

    // Validate table name if provided
    if (plan.table) {
        const allowedTables = schemaHint?.tables || DEFAULT_TABLES;
        if (Array.isArray(allowedTables) && !allowedTables.includes(plan.table)) {
            throw new ValidationError(`${ERROR_MESSAGES.UNKNOWN_TABLE}: ${plan.table}`);
        }
    }

    // Validate collection name if provided
    if (plan.collection) {
        const allowedCollections = schemaHint?.collections || DEFAULT_COLLECTIONS;
        if (Array.isArray(allowedCollections) && !allowedCollections.includes(plan.collection)) {
            throw new ValidationError(`${ERROR_MESSAGES.UNKNOWN_COLLECTION}: ${plan.collection}`);
        }
    }

    // Validate operation-specific requirements
    if (plan.operation === 'aggregate' && (!plan.pipeline || !Array.isArray(plan.pipeline))) {
        throw new ValidationError('Aggregate operation requires a valid pipeline array');
    }

    return plan;
}
