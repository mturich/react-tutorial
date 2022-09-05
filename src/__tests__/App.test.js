import React from 'react'
import {render, screen, act, waitFor, cleanup} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
//polyfill to the fetch api to run in an node env
import 'whatwg-fetch'
// to handle a REST like post request
import {setupServer} from 'msw/node'
import {rest} from 'msw'
//import { loadStripe } from '@stripe/stripe-js'
import App from '../App.js'
import CART from '../shared/cart.js'

//----------------------------------------------------------------
/* 
 jest.mock('@stripe/stripe-js', () => {
   const untouchedStripe = jest.requireActual('@stripe/stripe-js')

   jest.spyOn(untouchedStripe, 'loadStripe').mockImplementation(() => {
      return Promise.resolve({
         id: 'pk_test_51LYDlMGSORg56XufAuLQAcUuWYgqHjkZTSx0fLYs4EecMc6bXVtwd4qnkJEGKP1u7aXAi6I45t6f8IJRzoLtGiDk00ABSxWOKu',
      })
   })

   return {...untouchedStripe}
}) 

//jest.mock('@stripe/stripe-js/pure')

//jest.spyOn(mockLoadStripe, 'redirectToCheckout').mockResolvedValueOnce((props) => 42)

 // Step 1.
jest.mock("@stripe/stripe-js", () => {
   const original = jest.requireActual("@stripe/stripe-js"); // Step 2.
   return {
       ...original,
       mockLoadStripe: jest.fn()
   };
});

// Step 4. Inside of your test suite:
mockLoadStripe.mockResolvedValueOnce(() => {
   return new Promise(resolve => resolve() )
}); 
 */
//----------------------------------------------------------------

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

beforeAll(() => {
   server.listen({onUnhandledRequest: 'error'})
})

beforeEach(() => {
   Storage.prototype.getItem = jest.fn()
   

})

afterEach(() => {
   server.resetHandlers()
})

afterAll(() => {
   server.close()
   jest.clearAllMocks()
})


// test utils file
const renderWithRouter = (ui, {route = '/'} = {}) => {
   window.history.pushState({}, 'Test page', route)
 
   return {
     user: userEvent.setup(),
     ...render(ui, {wrapper: BrowserRouter}),
   }
 }


test('1: if navbar is there', () => {
   render(<App />)
   expect(screen.getByRole('link', {name: /Home/i})).toBeInTheDocument()
   expect(screen.getByRole('link', {name: /About us/i})).toBeInTheDocument()
   expect(screen.getByRole('link', {name: /Products/i})).toBeInTheDocument()
   expect(screen.getByRole('link', {name: /Cart/i})).toBeInTheDocument()
})

test('2: if home page is rendered correctly', () => {
   render(<App />)
   expect(screen.getByText(/Online shopping simplified/i)).toBeInTheDocument()
   expect(
      screen.getByRole('link', {name: 'Start shopping'}),
   ).toBeInTheDocument()
})

test('3: if Product Page is renderd correctly', async () => {
   const user = userEvent.setup()
   render(<App />)

   // Switch to Products
   const shopping = screen.getByRole('link', {name: 'Start shopping'})
   user.click(shopping)
   expect(await screen.findByText(/Cheese/)).toBeInTheDocument()
   expect(await screen.findByText(/200g cheese block/i)).toBeInTheDocument()
})

test('4: if product function are working', async () => {
   const user = userEvent.setup()
   //render(<App />)
   renderWithRouter(<App />, { route: '/' })
   user.click(screen.getByRole('link', {name: 'Start shopping'}))

   //search for AddProdToCart Button
   const addCheeseToCart = await screen.findByRole('button', {name: /10/i})
   expect(addCheeseToCart).toBeInTheDocument()
   // add Cheese to the cart
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(1)/i})).toBeInTheDocument()

   // checks if Product can be deleted
   const deleteProd = await screen.findByRole('button', {name: /x/i})
   expect(deleteProd).toBeInTheDocument()
   user.click(deleteProd)
   expect(await screen.findByRole('link', {name: /(0)/i})).toBeInTheDocument()

   // add another Cheese to the cart
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(1)/i})).toBeInTheDocument()
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(2)/i})).toBeInTheDocument()
})

test('5: test ProductInfoPage', async () => {
   const user = userEvent.setup()
   //render(<App />)
   renderWithRouter(<App />, { route: '/' })
   user.click(screen.getByRole('link', { name: 'Start shopping' }))
   
   // switch to ProductDetail Page
   const prodDetailLink = await screen.findByRole('link', {name: /cheese/i})
   user.click(prodDetailLink)

   expect(await screen.findByText(/Details/)).toBeInTheDocument()
   const detailLink = await screen.findByRole('link', {name: /Details/})
   expect(detailLink).toBeInTheDocument()
   expect(await screen.findByRole('button', {name: /10/i})).toBeInTheDocument()

   const nutritionLink = screen.getByRole('link', {name: /Nutrition/i})
   expect(nutritionLink).toBeInTheDocument()

   user.click(nutritionLink)
   expect(await screen.findByRole('table')).toMatchSnapshot('nutrition')
   user.click(detailLink)

   user.click(await screen.findByRole('button', {name: /10/i}))
   expect(await screen.findByRole('link', {name: /(1)/})).toBeInTheDocument()
})

test('6: tests if Cart component is working properly if empty', async () => {
   const user = userEvent.setup()
   renderWithRouter(<App />, { route: '/' })

   // Switch to Cart
   const cart = screen.getByRole('link', {name: /Cart/i})
   user.click(cart)
   expect(await screen.findByText('Your Cart')).toBeInTheDocument()
   expect(screen.getByText('You have not added any product to your cart yet.')).toBeInTheDocument()
   
})

test('7: tests if Cart component is working properly if NOT empty', async () => {
   const user = userEvent.setup()
   renderWithRouter(<App />, { route: '/' })   
      
   user.click(screen.getByRole('link', {name: 'Start shopping'}))
   expect(await screen.findByRole('link', {name: /(0)/i})).toBeInTheDocument()
   //search for AddProdToCart Button
   const addCheeseToCart = await screen.findByRole('button', { name: /10/i })
   // add Cheese to the cart
   user.click(addCheeseToCart)
   user.click(addCheeseToCart)
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(3)/i})).toBeInTheDocument()

   // Switch to Cart
   user.click(screen.getByRole('link', { name: /Cart/i }))
   // check for chart table
   expect(await screen.findByRole('table')).toMatchSnapshot('cart')

   const email = screen.getByLabelText(/Email/i)
   expect(email).toBeInTheDocument()
   expect(email).toHaveTextContent('')
   
   await act(() => user.type(email, 'onlineshop1@outlook.de'))
   expect(email).toHaveValue('onlineshop1@outlook.de')
   
   const pay = screen.getByRole('button', {name: /Pay/i})
   user.click(pay)
})
   
   test('7: if Stripe checkout works', async () => {
      const user = userEvent.setup()
      render(<App />)
      //checks if

      
   //await waitFor(() => console.log(loadStripe.mock))
   //await waitFor(() => expect(loadStripe).toBeCalledTimes(1))
   //expect(mockLoadStripe).toHaveBeenCalledWith('paid with stripe')
})

test.skip('all together', async () => {
   render(<App />)

   // 1: if navbar is there
   expect(screen.getByRole('link', {name: /Home/i})).toBeInTheDocument()
   expect(screen.getByRole('link', {name: /About us/i})).toBeInTheDocument()
   expect(screen.getByRole('link', {name: /Products/i})).toBeInTheDocument()
   expect(screen.getByRole('link', {name: /Cart/i})).toBeInTheDocument()

   expect(screen.getByText(/Online shopping simplified/i)).toBeInTheDocument()
   expect(
      screen.getByRole('link', {name: 'Start shopping'}),
   ).toBeInTheDocument()

   // Switch to Products
   const shopping = screen.getByRole('link', {name: 'Start shopping'})
   user.click(shopping)
   expect(await screen.findByText(/Cheese/)).toBeInTheDocument()
   expect(await screen.findByText(/200g cheese block/i)).toBeInTheDocument()

   //search for AddProdToCart Button
   const addCheeseToCart = await screen.findByRole('button', {name: /10/i})
   expect(addCheeseToCart).toBeInTheDocument()
   // add Cheese to the cart
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(1)/i})).toBeInTheDocument()

   // checks if Product can be deleted
   const deleteProd = await screen.findByRole('button', {name: /x/i})
   expect(deleteProd).toBeInTheDocument()
   user.click(deleteProd)
   expect(await screen.findByRole('link', {name: /(0)/i})).toBeInTheDocument()

   // add another Cheese to the cart
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(1)/i})).toBeInTheDocument()
   user.click(addCheeseToCart)
   expect(await screen.findByRole('link', {name: /(2)/i})).toBeInTheDocument()

   // switch to ProductDetail Page
   const prodDetailLink = await screen.findByRole('link', {name: /cheese/i})
   user.click(prodDetailLink)

   expect(await screen.findByText(/Details/)).toBeInTheDocument()
   const detailLink = await screen.findByRole('link', {name: /Details/})
   expect(detailLink).toBeInTheDocument()
   expect(await screen.findByRole('button', {name: /10/i})).toBeInTheDocument()

   const nutritionLink = screen.getByRole('link', {name: /Nutrition/i})
   expect(nutritionLink).toBeInTheDocument()

   user.click(nutritionLink)
   expect(await screen.findByRole('table')).toMatchSnapshot('nutrition')
   user.click(detailLink)

   user.click(await screen.findByRole('button', {name: /10/i}))
   expect(await screen.findByRole('link', {name: /(3)/})).toBeInTheDocument()

   // 6: tests if Cart component is working properly'

   const cart = screen.getByRole('link', {name: /Cart/i})
   // Switch to Cart
   user.click(cart)
   expect(await screen.findByText('Your Cart')).toBeInTheDocument()
   // check for chart table
   expect(await screen.findByRole('table')).toMatchSnapshot('cart')

   //checks if
   const email = screen.getByLabelText(/Email/i)
   expect(email).toBeInTheDocument()
   expect(email).toHaveTextContent('')

   await act(() => user.type(email, 'onlineshop1@outlook.de'))
   expect(email).toHaveValue('onlineshop1@outlook.de')

   const pay = screen.getByRole('button', {name: /Pay/i})
   user.click(pay)

   // 7: test stipe

   //await waitFor(() => console.log(loadStripe.mock))
   //await waitFor(() => expect(loadStripe).toBeCalledTimes(1))
   //expect(mockLoadStripe).toHaveBeenCalledWith('paid with stripe')
})
