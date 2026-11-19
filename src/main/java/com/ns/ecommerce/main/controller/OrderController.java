package com.ns.ecommerce.main.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.ns.ecommerce.main.model.Order;
import com.ns.ecommerce.main.model.Product;
import com.ns.ecommerce.main.model.User;
import com.ns.ecommerce.main.repository.OrderRepository;
import com.ns.ecommerce.main.service.EmailService;

import com.ns.ecommerce.main.model.Discount;
import com.ns.ecommerce.main.service.DiscountService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/order")
public class OrderController 
{

	private final OrderRepository orderRepository;
	private final DiscountService discountService;

	@Autowired
	private EmailService emailService;

	public OrderController(OrderRepository orderRepository,DiscountService discountService) 
	{
		this.orderRepository = orderRepository;
		this.discountService=discountService;
	}


	
	
	@PostMapping("/place")
	public String placeOrder(@RequestParam("payment") String paymentMode,
	                         HttpSession session) {
	
	    User user = (User) session.getAttribute("user");
	
	    if (user == null) {
	        session.setAttribute("error", "Please log in before placing an order.");
	        return "redirect:/users/login";
	    }
	
	    List<Product> cart = (List<Product>) session.getAttribute("cart");
	
	    if (cart == null || cart.isEmpty()) {
	        session.setAttribute("error", "Your cart is empty!");
	        return "redirect:/cart";
	    }
	
	    // Get the latest discount
	    Discount discount = discountService.getLatestDiscount();
	
	    // Check whether the customer actually applied the discount
	    Object appliedDiscountId = session.getAttribute("appliedDiscountId");
	
	    double discountPercentage = 0;
	
	    if (discount != null
	            && discount.isAvailable()
	            && discount.getId().equals(appliedDiscountId)) {
	
	        discountPercentage = discount.getDiscountPercentage();
	    }
	
	    // Calculate the final amount
	    double totalAmount = 0;
	
	    for (Product product : cart) {
	
	        double originalPrice = product.getPrice();
	
	        double discountedPrice = originalPrice -
	                (originalPrice * discountPercentage / 100);
	
	        totalAmount += discountedPrice;
	    }
	
	    // Save order
	    Order order = new Order(
	            user, cart, totalAmount, paymentMode, "Pending"
	    );
	
	    orderRepository.save(order);
	
	    session.setAttribute("lastOrder", order);
	
	    // Prepare confirmation email
	    String subject = "🎉 Order Confirmation - Thank You for Shopping!";
	
	    StringBuilder body = new StringBuilder();
	
	    body.append("<html><body>")
	        .append("<p>Dear <strong>")
	        .append(user.getName())
	        .append("</strong>,</p>")
	        .append("<p>Your order has been placed successfully! ✅</p>")
	        .append("<p>Here are your order details:</p><ul>");
	
	    for (Product product : cart) {
	
	        double originalPrice = product.getPrice();
	
	        double finalPrice = originalPrice -
	                (originalPrice * discountPercentage / 100);
	
	        body.append("<li>")
	            .append(product.getName())
	            .append(" - ₹")
	            .append(String.format("%.2f", finalPrice))
	            .append("</li>");
	    }
	
	    body.append("</ul>")
	        .append("<h3>Total Amount: ₹")
	        .append(String.format("%.2f", totalAmount))
	        .append("</h3>")
	        .append("<p>Thank you for shopping with us!</p>")
	        .append("<p><strong>Best Regards,</strong><br>Anusha N S</p>")
	        .append("</body></html>");
	
	    emailService.sendEmail(user.getEmail(), subject, body.toString());
	
	    // Clear cart and applied discount after placing the order
	    session.removeAttribute("cart");
	    session.removeAttribute("appliedDiscountId");
	
	    return "redirect:/order/confirmation";
	}


	@GetMapping("/confirmation")
	public String showConfirmation(HttpSession session)
	{
		session.setAttribute("message", "Your order has been placed successfully!");

		Order order = (Order) session.getAttribute("lastOrder");
		if (order != null) 
		{
			session.setAttribute("order", order);
		}

		return "order_confirmation";
	}

	@GetMapping("/checkout")
	public String checkout(HttpSession session) 
	{
		return "checkout";
	}

	@GetMapping("/history")
	public String orderHistory(HttpSession session, Model model) 
	{
		User user = (User) session.getAttribute("user");

		if (user == null) {
			session.setAttribute("error", "Please log in to view your order history.");
			return "redirect:/users/login";
		}

		List<Order> orders = orderRepository.findByUser(user);
		model.addAttribute("orders", orders);

		return "order_history";
	}

}
