import config from '../../config/configuration';
import axios from 'axios';
import { first, get } from 'lodash';

const { DELIVERY_COURIERS_URL, SEND_ORDERS_TO_COURIER_URL } = config();
export const deliveryCourier = async (body: any, options = {}) => {
  try {
    const { data } = await axios.post(DELIVERY_COURIERS_URL, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: '*./*',
      },
      ...options,
    });
    return get(first(data), 'couriers', []);
  } catch (error) {
    console.log(`error calling ${DELIVERY_COURIERS_URL}`, error);
    return [];
  }
};

export const sendOrdersToCourier = async (body: any, options = {}) => {
  try {
    const { data } = await axios.post(SEND_ORDERS_TO_COURIER_URL, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: '*./*',
      },
      ...options,
    });
    return data
  } catch (error) {
    console.log(`error calling ${DELIVERY_COURIERS_URL}`, error);
    return null;
  }
};

