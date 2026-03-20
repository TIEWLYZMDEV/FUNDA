const getAllTables = async (tableDAO) => {
  return await tableDAO.findAllTables();
};

const registerTable = async (tableDAO, { name, capacity }) => {
  return await tableDAO.createTable({ name, capacity });
};

const freeTable = async ({ reservationDAO, tableDAO }, tableId) => {
  const table = await tableDAO.findTableById(tableId);
  if (!table)
    throw {
      status: 404,
      message: "Restaurant table not found!",
    };

  return await tableDAO.freeTable(reservationDAO, table);
};

const deleteTable = async (tableDAO, tableId) => {
  const table = await tableDAO.findTableById(tableId);
  if (!table)
    throw {
      status: 404,
      message: "Restaurant table not found!",
    };

  if (table.isOccupied || table.reservationId)
    throw {
      status: 400,
      message: "You cannot delete an occupied table!",
    };

  await table.destroy();

  return {
    id: table.id,
    name: table.name,
  };
};

module.exports = {
  getAllTables,
  registerTable,
  freeTable,
  deleteTable,
};
