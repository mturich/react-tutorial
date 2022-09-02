import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

//polyfill to the fetch api to run in an node env
import 'whatwg-fetch'
// to handle a REST like post request
import {setupServer} from 'msw/node'
import {rest} from 'msw'

import App from '../App.js'
import CART from '../shared/cart.js'

//console.log('this is the cart obj ', CART)

const server = setupServer(
   // res - response, req - request, ctx - context
   rest.get(
      'https://react-tutorial-demo.firebaseio.com/supermarket.json',
      (req, res, ctx) => {
         return res(ctx.json(CART))
      },
   ),
   rest.get(
      'https://react-tutorial-demo.firebaseio.com/productinfo/id1.json',
      (req, res, ctx) => {
         return res(ctx.json(CART[0]))
      },
   ),
)

beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// NOT WORKING !!!!!
//jest.mock('../useFetch.js')
/* jest.mock('../useFetch.js', (props) => {
   return function useFetch(props){

  
      function get(prop) {
           return new Promise(resolve => {
             resolve(CART)
            })
         
      }
      function loading() { 
         () => false
      }
      return {get, loading}
   }
 }) 
 */

test('tests the Product rendering by intercepting FETCH call', async () => {
   const user = userEvent.setup()
   render(<App />)
   expect(screen.getByText(/Online shopping simplified/i)).toBeInTheDocument()
   expect(screen.getByText(/Home/i)).toBeInTheDocument()

   const cart = screen.getByRole('link', {name: /Cart/i})
   expect(cart).toBeInTheDocument()

   // Switch to Products
   const shopping = screen.getByRole('link', {name: /shopping/i})
   user.click(shopping)
   expect(await screen.findByText(/Cheese/)).toBeInTheDocument()
   expect(await screen.findByText(/200g cheese block/i)).toBeInTheDocument()

   //search for AddProdToCart Button
   const addCheeseToCart = await screen.findByRole('button', {name: /10/i})
   expect(addCheeseToCart).toBeInTheDocument()
   // add Cheese to the cart
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(1)/i})).toBeInTheDocument()
   // add another Cheese to the cart
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(2)/i})).toBeInTheDocument()

   // switch to ProductDetail Page
   const prodDetailLink = screen.getByRole('link', {name: /cheese/i})
   user.click(prodDetailLink)
   expect(await screen.findByText(/Details/)).toBeInTheDocument()

   const detailLink = await screen.findByRole('link', {name: /Details/})
   expect(detailLink).toBeInTheDocument()
   const addToCart = await screen.findByRole('button', {name: /10/i})
   //screen.debug()

   //-------------------------------
   const nutritionLink = await screen.findByRole('link', {name: /Nutrition/i})
   expect(nutritionLink).toBeInTheDocument()

   user.click(nutritionLink)

   //--------------------

   user.click(detailLink)

   user.click(addToCart)
   expect(await screen.findByRole('link', {name: /(3)/})).toBeInTheDocument()

   // Switch to Cart
   user.click(cart)
   expect(await screen.findByText('Your Cart')).toBeInTheDocument()
   // check for chart table
   const table = await screen.findByRole('table')
   expect(table).toMatchSnapshot()
})
