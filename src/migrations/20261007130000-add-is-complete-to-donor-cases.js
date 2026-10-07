'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');
      if (!tableInfo.is_complete) {
        await queryInterface.addColumn('donor_cases', 'is_complete', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
        });
      }
    } catch (e) {
      console.error('Migration is_complete up error:', e);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');
      if (tableInfo.is_complete) {
        await queryInterface.removeColumn('donor_cases', 'is_complete');
      }
    } catch (e) {
      console.error('Migration is_complete down error:', e);
    }
  }
};
