'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users');

    if (!tableInfo.status) {
      await queryInterface.addColumn('users', 'status', {
        type: Sequelize.ENUM('pending', 'active', 'suspended'),
        allowNull: false,
        defaultValue: 'pending',
      });

      await queryInterface.sequelize.query(
        "UPDATE users SET status = CASE WHEN is_active = 1 THEN 'active' ELSE 'pending' END",
      );
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('users');
    if (tableInfo.status) {
      await queryInterface.removeColumn('users', 'status');
    }
  },
};
