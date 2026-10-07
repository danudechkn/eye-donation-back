'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');
      if (!tableInfo.status) {
        await queryInterface.addColumn('donor_cases', 'status', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 1,
        });
      }
    } catch (e) {
      // Table might not exist yet if fresh install
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');
      if (tableInfo.status) {
        await queryInterface.removeColumn('donor_cases', 'status');
      }
    } catch (e) {
      // ignore
    }
  }
};
