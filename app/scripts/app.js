let client;

init();

async function init() {
  client = await app.initialized();
  client.events.on('app.activated', renderText);
}

async function renderText() {
  const textElement = document.getElementById('apptext');
  const contactData = await client.data.get('contact');
  const {
    contact: { name }
  } = contactData;

  textElement.innerHTML = `Ticket is created by ${name}`;

  try {
    let response = await client.request.invokeTemplate("getOrders", {});
    console.log('getOrders', response);
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

async function toastOrder(orderMessage, type){
  try {
    let result = await client.interface.trigger("showConfirm", {
      title: "Confim", 
      message: orderMessage,
      saveLabel: "Yes",
      cancelLabel: "No"
    });
    console.log(result);
    if(result.message == 'Yes') {
      switch(type) {
        case 'RETURN':
          alertMsg('Your order return request has been successfully submitted. Check your email for further details.');
          break;
        case 'REFUND':
            alertMsg("Thank you for submitting your refund request. Please check your email for further instructions.");
            break;
        case 'REPLACE':
            alertMsg("Your replacement request has been submitted successfully.");
            break;
      }
    }
  } catch (error) {
    console.error(error);
  }
}


async function alertMsg(message) {
  try {
    let data = await client.interface.trigger("showNotify", {
      type: "success",
      message: message
    });
      console.log(data); 
  } catch (error) {
      console.error(error);
  }
}

async function raiseTicket() {
  try {
    let data = await client.interface.trigger("click", {
      id: "ticket",
      value: 1
    });
    console.log(data); // success message
  } catch (error) {
      // failure operation
    console.error(error);
  }
}

async function handleClick(orderId) {  
  try {
      // Fetch order details
      const response = await fetch(`http://ec2-3-110-170-64.ap-south-1.compute.amazonaws.com:3000/orders/${orderId}`);
      const order = await response.json();

      // Update modal with order details
      $('#modal-order-id').text(order.order_identifier);
      $('#modal-customer-name').text(order.customer_name);
      $('#modal-order-date').text(order.order_date);
      $('#modal-amount-paid').text(order.amount_paid);
      $('#modal-delivery-mode').text(order.delivery_mode);
      $('#modal-order-sent').text(order.order_sent);
      $('#modal-order-wish').text(order.order_wish);
      $('#modal-order-expected').text(order.order_expected);

      // Populate order items table
      const itemsTable = $('#orderItemsTable').DataTable();
      itemsTable.clear().draw();
      order.order_items.forEach((item, i) => {
          itemsTable.row.add([
              `<img src="./styles/images/${i + 1}.jpeg" alt="Thumbnail" style="width:50px;height:50px;">`,
              item.product_name,
              item.number_of_units,
              item.details
          ]).draw();
      });

      $('#orderItemsTable tbody tr').each(function() {
        $(this).find('td').addClass('text-center');
    });

      // Populate delivery details table
      const detailsTable = $('#deliveryDetailsTable').DataTable();
      detailsTable.clear().draw();
      order.order_items.forEach(item => {
          if (item.delivery_details) {
              item.delivery_details.forEach(detail => {
                  const trackingLink = `<a href="https://bluedart.com/trackdartresultthirdparty?trackFor=0&trackNo=78057620045" target="_blank">Track Order</a>`;
                  detailsTable.row.add([
                      detail.delivery_mode,
                      detail.address,
                      detail.status,
                      trackingLink
                  ]).draw();
              });
          }
      });

      $('#deliveryDetailsTable tbody tr').each(function() {
        $(this).find('td').addClass('text-center');
    });
      
      $('#orderModal').modal('show');

  } catch (error) {
      console.error('Error fetching order details:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchOrderData();
});

async function fetchOrderData() {
  try {
  const response = await fetch(`http://ec2-3-110-170-64.ap-south-1.compute.amazonaws.com:3000/orders`);
  const orders = await response.json();
    console.log('fetchOrderData', orders)
          const labels = [];
          const orderCounts = [];
          orders.forEach(order => {
             order.formattedDate = new Date(order.order_date).toISOString().split('T')[0];
              const date = new Date(order.formattedDate).toLocaleDateString();
              if (!labels.includes(date)) {
                  labels.push(date);
                  orderCounts.push(1);
              } else {
                  const index = labels.indexOf(date);
                  orderCounts[index]++;
              }
          });

          createChart(labels, orderCounts);
          forEach(order => {
            order.formattedDate = new Date(order.order_date).toISOString().split('T')[0];
            const date = new Date(order.formattedDate).toLocaleDateString();
            if (!labels.includes(date)) {
                labels.push(date);
            }

            const index = labels.indexOf(date);
            const status = order.status || 'Unknown'; // Default to 'Unknown' if status is missing
            if (statusCounts[status]) {
                statusCounts[status][index] = (statusCounts[status][index] || 0) + 1;
            }
        });

        // Create the chart
        createChart(labels, statusCounts);
    }
      catch(error) { 
        console.error('Error fetching order data:', error)
        };
}

function createChart(labels, data) {
  const ctx = document.getElementById('ordersChart').getContext('2d');
  new Chart(ctx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [{
              label: 'Number of Orders',
              data: data,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              borderRadius: 5,
              hoverBackgroundColor: 'rgba(75, 192, 192, 0.5)',
              hoverBorderColor: 'rgba(75, 192, 192, 1)'
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: {
                  position: 'top',
                  labels: {
                      font: {
                          size: 14
                      }
                  }
              },
              tooltip: {
                  callbacks: {
                      label: function(tooltipItem) {
                          return `Date: ${tooltipItem.label}, Orders: ${tooltipItem.raw}`;
                      }
                  }
              }
          },
          scales: {
              x: {
                  beginAtZero: true,
                  ticks: {
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 45
                  },
                  title: {
                      display: true,
                      text: 'Order Dates'
                  }
              },
              y: {
                  beginAtZero: true,
                  title: {
                      display: true,
                      text: 'Number of Orders'
                  }
              }
          },
          animation: {
              duration: 1000,
              easing: 'easeOutBounce'
          }
      }
  });
}