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

    await queryInterface.bulkInsert('options', [{
      options_type_id: 1,
      value: 1,
      meaning: 'Brain Death',
      flag_active: 'Y',
    }, {
      options_type_id: 1,
      value: 2,
      meaning: 'Cardiac Death',
      flag_active: 'Y',
    }, {
      options_type_id: 2,
      value: 1,
      meaning: 'Yes',
      flag_active: 'Y',
    }, {
      options_type_id: 2,
      value: 2,
      meaning: 'No',
      flag_active: 'Y',
    }, {
      options_type_id: 3,
      value: 1,
      meaning: 'Evaluated',
      flag_active: 'Y',
    }, {
      options_type_id: 3,
      value: 2,
      meaning: 'Not Evaluated',
      flag_active: 'Y',
    }, {
      options_type_id: 4,
      value: 1,
      meaning: 'แจ้ง TC แล้ว',
      flag_active: 'Y',
    }, {
      options_type_id: 4,
      value: 2,
      meaning: 'ไม่ได้แจ้ง',
      flag_active: 'Y',
    }, {
      options_type_id: 5,
      value: 1,
      meaning: 'เจรจาแล้ว',
      flag_active: 'Y',
    }, {
      options_type_id: 5,
      value: 2,
      meaning: 'ไม่ได้เจรจา',
      flag_active: 'Y',
    }, {
      options_type_id: 6,
      value: 1,
      meaning: 'สำเร็จ',
      flag_active: 'Y',
    }, {
      options_type_id: 6,
      value: 2,
      meaning: 'ไม่สำเร็จ',
      flag_active: 'Y',
    }, {
      options_type_id: 7,
      value: 1,
      meaning: 'จัดเก็บได้',
      flag_active: 'Y',
    }, {
      options_type_id: 7,
      value: 2,
      meaning: 'จัดเก็บไม่ได้',
      flag_active: 'Y',
    }, {
      options_type_id: 8,
      value: 0,
      meaning: 'ไม่ได้',
      flag_active: 'Y',
    }, {
      options_type_id: 8,
      value: 1,
      meaning: '1 ดวง',
      flag_active: 'Y',
    }, {
      options_type_id: 8,
      value: 2,
      meaning: '2 ดวง',
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
