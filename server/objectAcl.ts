// Access Control List (ACL) for Object Storage
// Based on Replit Object Storage blueprint (blueprint:javascript_object_storage)
// 
// YoForex Use Cases:
// - EA files: Private (only purchasers can download)
// - Screenshots: Public (anyone can view on product pages)
// - User uploads: Protected (owner + buyers)
import { File } from "@google-cloud/storage";
import { db } from "./db.js";
import { contentPurchases } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

// The type of the access group for YoForex
export enum ObjectAccessGroupType {
  PURCHASERS = "purchasers", // Users who purchased this content
  FOLLOWERS = "followers",   // Users following the content author
}

// The logic user group that can access the object.
export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string; // Content ID or User ID
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

// The ACL policy of the object.
// This would be set as part of the object custom metadata:
// - key: "custom:aclPolicy"
// - value: JSON string of the ObjectAclPolicy object.
export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

// Check if the requested permission is allowed based on the granted permission.
function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  // Users granted with read or write permissions can read the object.
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }

  // Only users granted with write permissions can write the object.
  return granted === ObjectPermission.WRITE;
}

// The base class for all access groups.
abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  // Check if the user is a member of the group.
  public abstract hasMember(userId: string): Promise<boolean>;
}

// Purchasers access group - users who purchased the content
class PurchasersAccessGroup extends BaseObjectAccessGroup {
  constructor(contentId: string) {
    super(ObjectAccessGroupType.PURCHASERS, contentId);
  }

  async hasMember(userId: string): Promise<boolean> {
    try {
      // Check if user has purchased this content from database
      const purchase = await db
        .select()
        .from(contentPurchases)
        .where(
          and(
            eq(contentPurchases.contentId, this.id),
            eq(contentPurchases.buyerId, userId)
          )
        )
        .limit(1);
      
      return purchase.length > 0;
    } catch (error) {
      console.error(`[ACL] Error checking purchase for user ${userId} and content ${this.id}:`, error);
      return false;
    }
  }
}

// Followers access group - users following the content author
class FollowersAccessGroup extends BaseObjectAccessGroup {
  constructor(authorId: string) {
    super(ObjectAccessGroupType.FOLLOWERS, authorId);
  }

  async hasMember(userId: string): Promise<boolean> {
    // TODO: Check if user follows the author from database
    // For now, return false (will be implemented with follow system)
    return false;
  }
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    case ObjectAccessGroupType.PURCHASERS:
      return new PurchasersAccessGroup(group.id);
    case ObjectAccessGroupType.FOLLOWERS:
      return new FollowersAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

// Sets the ACL policy to the object metadata.
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

// Gets the ACL policy from the object metadata.
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

// Checks if the user can access the object.
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  // When this function is called, the acl policy is required.
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  // Public objects are always accessible for read.
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Access control requires the user id.
  if (!userId) {
    return false;
  }

  // The owner of the object can always access it.
  if (aclPolicy.owner === userId) {
    return true;
  }

  // Go through the ACL rules to check if the user has the required permission.
  for (const rule of aclPolicy.aclRules || []) {
    try {
      const accessGroup = createObjectAccessGroup(rule.group);
      if (
        (await accessGroup.hasMember(userId)) &&
        isPermissionAllowed(requestedPermission, rule.permission)
      ) {
        return true;
      }
    } catch (error) {
      console.error(`[ACL] Error processing ACL rule for group ${rule.group.type}:`, error);
      // Continue to next rule instead of failing entirely
      continue;
    }
  }

  return false;
}
