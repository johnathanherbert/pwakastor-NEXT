import { supabase } from '../supabaseClient';

/**
 * Setups a realtime subscription for a Supabase table
 * @param {string} table - The table name to subscribe to
 * @param {function} callback - The callback function to call when data changes
 * @param {Object} options - Additional options for the subscription
 * @returns {Object} - The subscription object
 */
export const setupRealtimeSubscription = (table, callback, options = {}) => {
  console.log(`Setting up realtime subscription for ${table}`);
  
  // Default options
  const defaultOptions = { 
    event: '*', 
    schema: 'public' 
  };
  
  // Merge options
  const subscriptionOptions = { ...defaultOptions, ...options };
  
  try {
    // Create a unique channel name based on table and a random value
    const channelName = `${table}-${Math.random().toString(36).substring(2, 10)}`;
    
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: subscriptionOptions.event, schema: subscriptionOptions.schema, table }, 
        (payload) => {
          console.log(`Realtime update from ${table}:`, payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  } catch (error) {
    console.error(`Error setting up realtime subscription for ${table}:`, error);
    return null;
  }
};

/**
 * Removes a subscription
 * @param {Object} subscription - The subscription to remove
 */
export const removeSubscription = (subscription) => {
  if (!subscription) return;
  
  try {
    supabase.removeChannel(subscription);
    console.log('Realtime subscription removed');
  } catch (error) {
    console.error('Error removing realtime subscription:', error);
  }
};

/**
 * Setups multiple realtime subscriptions
 * @param {Array} subscriptions - Array of subscription configs
 * @returns {Array} - Array of subscription objects
 */
export const setupMultipleSubscriptions = (subscriptions) => {
  return subscriptions.map(sub => {
    return setupRealtimeSubscription(sub.table, sub.callback, sub.options);
  });
};

/**
 * Removes multiple subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 */
export const removeMultipleSubscriptions = (subscriptions) => {
  subscriptions.forEach(sub => {
    if (sub) removeSubscription(sub);
  });
};
