import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

//polyfill to the fetch api to run in an node env
import 'whatwg-fetch'
// to handle a REST like post request
import {setupServer} from 'msw/node'
import {rest} from 'msw'

import App from '../App.js'
import CART from '../shared/cart.js'

console.log('this is the cart obj ', CART[0])

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

   const shopping = screen.getByRole('link', {name: /shopping/i})
   user.click(shopping)

   //await waitFor(() => screen.debug())
   //await waitFor(() => expect(screen.getByText(/Cheese/)).toBeInTheDocument())
   expect(await screen.findByText(/Cheese/)).toBeInTheDocument()
   expect(await screen.findByText(/200g cheese block/i)).toBeInTheDocument()

   const addCheeseToCart = await screen.findByRole('button', {name: /10/i})
   expect(addCheeseToCart).toBeInTheDocument()

   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(1)/i})).toBeInTheDocument()

   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(2)/i})).toBeInTheDocument()

   const prodDetailLink = screen.getByRole('link', {name: /cheese/i})
   user.click(prodDetailLink)
   expect(await screen.findByText(/Details/)).toBeInTheDocument()
   screen.debug()
   const toCart = screen.getByRole('button', {name: /10/i})
   user.click(toCart)
   expect(await screen.findByRole('link', {name: /3/i})).toBeInTheDocument()

   user.click(cart)
   expect(await screen.findByText('Your Cart')).toBeInTheDocument()
   const table = await screen.findByRole('table')
   expect(table).toMatchSnapshot()
})
