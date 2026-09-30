'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('options_type', [{
      name: 'Brain Cardiac',
      column_name: 'braincardiac',
      flag_active: 'Y',
    }, {
      name: 'Potential',
      column_name: 'potential',
      flag_active: 'Y',
    }, {
      name: 'Check Potential',
      column_name: 'chkpotential',
      flag_active: 'Y',
    }, {
      name: 'Ward to TC',
      column_name: 'wardtotc',
      flag_active: 'Y',
    }, {
      name: 'Negotiate',
      column_name: 'negotiate',
      flag_active: 'Y',
    }, {
      name: 'Negotiate Success',
      column_name: 'negotiate_succ',
      flag_active: 'Y',
    }, {
      name: 'Get Eye',
      column_name: 'geteye',
      flag_active: 'Y',
    }, {
      name: 'Eye Total',
      column_name: 'eyetotal',
      flag_active: 'Y',
    }], {});

  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
