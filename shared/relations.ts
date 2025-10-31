// Drizzle Relations for Relational Query API
// This file defines relationships between tables for use with db.query API

import { relations } from 'drizzle-orm';
import {
  users,
  forumThreads,
  forumReplies,
  content,
  contentReviews,
  brokers,
  brokerReviews,
  contentPurchases,
} from './schema';

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  threads: many(forumThreads),
  replies: many(forumReplies),
  content: many(content),
  reviews: many(contentReviews),
  brokerReviews: many(brokerReviews),
  purchases: many(contentPurchases, { relationName: 'buyer' }),
  sales: many(contentPurchases, { relationName: 'seller' }),
}));

// Forum Threads Relations
export const forumThreadsRelations = relations(forumThreads, ({ one, many }) => ({
  author: one(users, {
    fields: [forumThreads.authorId],
    references: [users.id],
  }),
  replies: many(forumReplies),
}));

// Forum Replies Relations
export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  thread: one(forumThreads, {
    fields: [forumReplies.threadId],
    references: [forumThreads.id],
  }),
  author: one(users, {
    fields: [forumReplies.userId],
    references: [users.id],
  }),
}));

// Content Relations
export const contentRelations = relations(content, ({ one, many }) => ({
  author: one(users, {
    fields: [content.authorId],
    references: [users.id],
  }),
  reviews: many(contentReviews),
  purchases: many(contentPurchases),
}));

// Content Reviews Relations
export const contentReviewsRelations = relations(contentReviews, ({ one }) => ({
  content: one(content, {
    fields: [contentReviews.contentId],
    references: [content.id],
  }),
  author: one(users, {
    fields: [contentReviews.userId],
    references: [users.id],
  }),
}));

// Broker Relations
export const brokersRelations = relations(brokers, ({ many }) => ({
  reviews: many(brokerReviews),
}));

// Broker Reviews Relations
export const brokerReviewsRelations = relations(brokerReviews, ({ one }) => ({
  broker: one(brokers, {
    fields: [brokerReviews.brokerId],
    references: [brokers.id],
  }),
  author: one(users, {
    fields: [brokerReviews.userId],
    references: [users.id],
  }),
}));

// Content Purchases Relations
export const contentPurchasesRelations = relations(contentPurchases, ({ one }) => ({
  content: one(content, {
    fields: [contentPurchases.contentId],
    references: [content.id],
  }),
  buyer: one(users, {
    fields: [contentPurchases.buyerId],
    references: [users.id],
    relationName: 'buyer',
  }),
  seller: one(users, {
    fields: [contentPurchases.sellerId],
    references: [users.id],
    relationName: 'seller',
  }),
}));
