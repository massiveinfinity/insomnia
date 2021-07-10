import { database as db } from '../common/database';
import * as Workspace from '../models/workspace';
import * as RequestGroup from '../models/request-group';
import * as Environment from '../models/environment';
import * as plugins from '../plugins';
import * as pluginStore from './context/store';

export interface RequestType {
  _id: string,
  parentId: string,
  type: string,
}

const actionCreate = 'create';
const actionUpdate = 'update';
const actionDelete = 'delete';
const actionDuplicate = 'duplicate';

function getParentType(id: string) {
  if (id === undefined || id === null) {
    return null;
  } else if (id.includes(RequestGroup.prefix)) {
    return RequestGroup.type;
  } else if (id.includes(Workspace.prefix)) {
    return Workspace.type;
  } else if (id.includes(Environment.prefix)) {
    return Environment.type;
  }
  return null;
}

async function getWorkspaceId(parentType, parentId) {
  let workspaceId = parentId;
  if (parentType !== Workspace.type) {
    const items = await db.find(parentType, {
      _id: parentId,
    });
    if (items.length > 0) {
      workspaceId = items[0].parentId;
    }
  }

  return workspaceId;
}

async function callPluginModelHooks(hookData) {
  const appPlugins = await plugins.getModelHooks();
  for (const { plugin, hook } of appPlugins) {
    try {
      const store = {
        // ...(pluginStore.init(plugin): Object).store,
        ...(pluginStore.init(plugin)).store,
      };

      await hook({
        store,
        hook: hookData,
      });
    } catch (err) {
      err.plugin = plugin;
      throw err;
    }
  }
}

export async function create(requestType: RequestType) {
  const parentType = getParentType(requestType.parentId) || requestType.type;
  const workspaceId = await getWorkspaceId(parentType, requestType.parentId || requestType._id);

  const data = {
    type: requestType.type,
    actionType: actionCreate,
    id: requestType._id,
    workspaceId,
  };

  await callPluginModelHooks(data);
  return requestType;
}

export async function update(requestType: RequestType) {
  const parentType = getParentType(requestType.parentId) || requestType.type;
  const workspaceId = await getWorkspaceId(parentType, requestType.parentId || requestType._id);

  const data = {
    type: requestType.type,
    actionType: actionUpdate,
    id: requestType._id,
    workspaceId,
  };

  await callPluginModelHooks(data);
  return requestType;
}

export async function remove(requestType: RequestType) {
  const parentType = getParentType(requestType.parentId) || requestType.type;
  const workspaceId = await getWorkspaceId(parentType, requestType.parentId || requestType._id);

  const data = {
    type: requestType.type,
    actionType: actionDelete,
    id: requestType._id,
    workspaceId,
  };

  await callPluginModelHooks(data);
  return requestType;
}

export async function duplicate(requestType: RequestType) {
  const parentType = getParentType(requestType.parentId) || requestType.type;
  const workspaceId = await getWorkspaceId(parentType, requestType.parentId || requestType._id);

  const data = {
    type: requestType.type,
    actionType: actionDuplicate,
    id: requestType._id,
    workspaceId,
  };

  await callPluginModelHooks(data);
  return requestType;
}
